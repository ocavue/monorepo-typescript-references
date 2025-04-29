import type { FlagParametersForType } from '@stricli/core'

export interface Flags {
  configName: string
  rootConfigName: string
}

export const flags = {
  configName: {
    kind: 'parsed',
    parse: String,
    brief: 'The name of the tsconfig file to update in each package',
    default: 'tsconfig.json',
  },
  rootConfigName: {
    kind: 'parsed',
    parse: String,
    brief: 'The name of the tsconfig file to update in the monorepo root',
    default: 'tsconfig.json',
  },
} satisfies FlagParametersForType<Flags>
