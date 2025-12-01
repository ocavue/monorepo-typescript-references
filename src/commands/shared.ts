import type { FlagParametersForType } from '@stricli/core'

export interface Flags {
  configName: string[]
  rootConfigName: string[]
}

export const flags = {
  configName: {
    kind: 'parsed',
    parse: String,
    brief:
      'The name of the tsconfig file to update in each package. You can specify multiple file names by repeating the flag. Default: tsconfig.json',
    variadic: true,
  },
  rootConfigName: {
    kind: 'parsed',
    parse: String,
    brief:
      'The name of the tsconfig file to update in the monorepo root. You can specify multiple file names by repeating the flag. Default: tsconfig.json',
    variadic: true,
  },
} satisfies FlagParametersForType<Flags>

// Manually set the default values since Stricli does not support default
// values for variadic flags. See:
// https://github.com/bloomberg/stricli/issues/95
export function withDefaultFlags(flags: Flags): Flags {
  // prettier-ignore
  return {
    configName: flags.configName.length === 0 ? ['tsconfig.json'] : [...flags.configName],
    rootConfigName: flags.rootConfigName.length === 0 ? ['tsconfig.json'] : [...flags.rootConfigName],
  }
}
