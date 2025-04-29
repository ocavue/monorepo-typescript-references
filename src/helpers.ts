import fs from 'node:fs/promises'
import path from 'node:path'
import { normalize, relative } from 'node:path/posix'

import { findRoot } from '@manypkg/find-root'
import { getPackages } from '@manypkg/get-packages'
import * as JSONC from 'jsonc-parser'
import { isFile } from 'path-type'
import type { TsConfigJson } from 'type-fest'

import { log } from './log'

interface Options {
  rootConfigName: string
  configName: string
}

export async function checkTsconfigReferences(options: Options) {
  const rootPath: string = (await findRoot(process.cwd())).rootDir

  log(`Updating tsconfig references in monorepo at ${rootPath}`)

  const packages = await getPackages(rootPath)

  log(`Found ${packages.packages.length} packages`)
  for (const pkg of packages.packages) {
    log(`- ${pkg.dir}: ${pkg.packageJson.name}`)
  }

  const rootTsconfigFilePath = path.join(rootPath, options.rootConfigName)

  const rootTsconfig = await readTsconfig(rootTsconfigFilePath)

  const pkgToTsconfigFilePath = new Map<string, string>()
  const pkgToTsconfig = new Map<string, TsConfigJson>()
  const pkgToDependencies = new Map<string, string[]>()

  if (packages.rootPackage) {
    const rootPackageName = packages.rootPackage.packageJson.name
    pkgToTsconfigFilePath.set(rootPackageName, rootTsconfigFilePath)
    pkgToTsconfig.set(rootPackageName, rootTsconfig)
    pkgToDependencies.set(
      rootPackageName,
      packages.packages.map((pkg) => pkg.packageJson.name),
    )
  }

  await Promise.all(
    packages.packages.map(async (pkg) => {
      const pkgName: string = pkg.packageJson.name
      pkgToDependencies.set(pkgName, [
        ...Object.keys(pkg.packageJson.dependencies ?? {}),
        ...Object.keys(pkg.packageJson.devDependencies ?? {}),
        ...Object.keys(pkg.packageJson.peerDependencies ?? {}),
      ])

      const pkgTsconfigFilePath = path.join(pkg.dir, options.configName)
      const pkgTsconfig = await maybeReadTsconfig(pkgTsconfigFilePath)
      if (pkgTsconfig) {
        pkgToTsconfigFilePath.set(pkgName, pkgTsconfigFilePath)
        pkgToTsconfig.set(pkgName, pkgTsconfig)
      }
    }),
  )

  const needsUpdate: Record<string, string[]> = {}

  await Promise.all(
    packages.packages.map(async (pkg) => {
      const tsconfigFilePath = pkgToTsconfigFilePath.get(pkg.packageJson.name)
      const tsconfig = pkgToTsconfig.get(pkg.packageJson.name)
      if (!tsconfigFilePath || !tsconfig) {
        return
      }
      const dependencies = pkgToDependencies.get(pkg.packageJson.name) || []
      const dependenciesTsconfigFilePaths: string[] = dependencies
        .map((dependency) => pkgToTsconfigFilePath.get(dependency))
        .filter((x) => x != null)
      const references = dependenciesTsconfigFilePaths.map((filePath) =>
        relative(pkg.dir, filePath),
      )

      const updatedReferences = await updateTsconfigReferences(
        tsconfigFilePath,
        tsconfig,
        references,
      )
      if (!updatedReferences) {
        return
      }
      needsUpdate[tsconfigFilePath] = updatedReferences
    }),
  )

  return needsUpdate
}

async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    throw new Error(`Unable to read file ${filePath}. Does it exist?`)
  }
}

async function readTsconfig(filePath: string): Promise<TsConfigJson> {
  const content = await readFile(filePath)
  return JSONC.parse(content) as TsConfigJson
}

async function maybeReadTsconfig(
  filePath: string,
): Promise<TsConfigJson | undefined> {
  let content: string
  try {
    content = await readFile(filePath)
  } catch {
    // The file does not exist, so it is not a tsconfig file
    return undefined
  }

  try {
    return JSONC.parse(content) as TsConfigJson
  } catch (error) {
    throw new Error(
      `Unable to parse tsconfig file ${filePath}. Is it a valid JSON file?`,
      { cause: error },
    )
  }
}

export async function writeTsConfigReferences(
  tsconfigFilePath: string,
  references: string[],
) {
  log(`Writing tsconfig to ${tsconfigFilePath}`)
  let content = await readFile(tsconfigFilePath)
  content = modifyTsconfigReferences(content, references)
  content = formatTsconfig(content)
  await fs.writeFile(tsconfigFilePath, content)
}

function modifyTsconfigReferences(
  content: string,
  references: string[],
): string {
  const edits = JSONC.modify(
    content,
    ['references'],
    references.map((ref) => ({ path: ref })),
    {},
  )
  return JSONC.applyEdits(content, edits)
}

function formatTsconfig(content: string): string {
  const edits = JSONC.format(content, undefined, {})
  return JSONC.applyEdits(content, edits)
}

function getTsconfigReferences(tsconfig: TsConfigJson): string[] {
  return (tsconfig?.references ?? []).map((ref) => ref.path)
}

/**
 * Finds the tsconfig.json file path for the given directory or file path.
 *
 * Returns the file path if found, otherwise undefined.
 */
async function findTsconfigPath(
  dirOrFilePath: string,
): Promise<string | undefined> {
  // If the path is a file, return itself
  if (await isFile(dirOrFilePath)) {
    return dirOrFilePath
  }

  // Assume the path is a directory and look for a tsconfig.json file
  const filePath = path.join(dirOrFilePath, 'tsconfig.json')
  if (await isFile(filePath)) {
    return filePath
  }

  return undefined
}

/**
 * Updates the given tsconfig object with the new references.
 *
 * Returns an array of string representing the new references, or undefined
 * if the tsconfig does not need to be updated.
 */
async function updateTsconfigReferences(
  tsconfigFilePath: string,
  tsconfig: TsConfigJson,
  references: string[],
): Promise<string[] | undefined> {
  const tsconfigDirPath = path.dirname(tsconfigFilePath)
  const oldReferences = getTsconfigReferences(tsconfig)

  const candidateReferences = [
    // References based on the dependency graph
    ...references,
    // tsconfig references within the same package like `./tsconfig.node.json`
    ...oldReferences.filter((ref) => !ref.startsWith('..')),
  ]

  const existingReferences = (
    await Promise.all(
      candidateReferences.map(async (ref) => {
        const absRefPath = path.join(tsconfigDirPath, ref)
        const absRefFilePath = await findTsconfigPath(absRefPath)

        if (!absRefFilePath) {
          return
        }

        return normalizePath(tsconfigDirPath, absRefFilePath)
      }),
    )
  ).filter((x) => x != null)

  const newReferences = unique(existingReferences).sort()

  if (arrayItemsEquals(newReferences, oldReferences)) {
    return
  }

  return newReferences
}

function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

/**
 * Checks if two arrays have the same items, regardless of order.
 */
function arrayItemsEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  a = [...a].sort()
  b = [...b].sort()
  return a.every((value, index) => value === b[index])
}

function normalizePath(fromPath: string, toPath: string): string {
  const relativePath = normalize(relative(fromPath, toPath))
  if (
    relativePath.startsWith('..') ||
    relativePath.startsWith('./') ||
    relativePath === '.'
  ) {
    return relativePath
  }
  return `./${relativePath}`
}
