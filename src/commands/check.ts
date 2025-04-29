import { buildCommand } from '@stricli/core'

import { checkTsconfigReferences } from '../helpers'

import { type Flags, flags } from './shared'

export const checkCommand = buildCommand({
  func: async (flags: Flags) => {
    const needsUpdate = await checkTsconfigReferences({
      configName: flags.configName,
      rootConfigName: flags.rootConfigName,
    })

    if (Object.keys(needsUpdate).length > 0) {
      console.log('⚠️ The following tsconfig files need to be updated:')
      for (const filePath of Object.keys(needsUpdate).sort()) {
        console.log(`📃 ${filePath}`)
      }
      console.error(
        '❌ Please run `monorepo-typescript-references fix` to update the tsconfig files.',
      )
      process.exit(1)
    } else {
      console.log('✅ All tsconfig files are up to date.')
    }
  },
  parameters: {
    flags: flags,
  },
  docs: {
    brief: 'Check tsconfig references in the monorepo',
  },
})
