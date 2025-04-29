import { buildCommand } from '@stricli/core'

import { checkTsconfigReferences, writeTsConfigReferences } from '../helpers'

import { type Flags, flags } from './shared'

export const fixCommand = buildCommand({
  func: async (flags: Flags) => {
    const needsUpdate = await checkTsconfigReferences({
      configName: flags.configName,
      rootConfigName: flags.rootConfigName,
    })

    if (Object.keys(needsUpdate).length > 0) {
      console.log('🔧 Updating tsconfig references...')
      for (const [filePath, references] of Object.entries(needsUpdate).sort()) {
        console.log(`📃 ${filePath}`)
        await writeTsConfigReferences(filePath, references)
      }
      console.log(`✅ Updated all tsconfig files.`)
    } else {
      console.log('✅ All tsconfig files are up to date.')
    }
  },
  parameters: {
    flags: flags,
  },
  docs: {
    brief: 'Update tsconfig references in the monorepo',
  },
})
