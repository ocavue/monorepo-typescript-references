import type { FlagParametersForType } from '@stricli/core'

export interface Flags {
  configName?: string[]
  rootConfigName?: string[]
}

export const flags: FlagParametersForType<Flags> = {
  configName: {
    kind: 'parsed',
    parse: String,
    brief:
      'The name of the tsconfig file to update in each package. You can specify multiple file names by repeating the flag. Default: tsconfig.json',
    variadic: true,
    optional: true,
  },
  rootConfigName: {
    kind: 'parsed',
    parse: String,
    brief:
      'The name of the tsconfig file to update in the monorepo root. You can specify multiple file names by repeating the flag. Default: tsconfig.json',
    variadic: true,
    optional: true,
  },
}

// Manually set the default values since Stricli does not support default
// values for variadic flags. See:
// https://github.com/bloomberg/stricli/issues/95
export function withDefaultFlags(inputFlags: Flags): Required<Flags> {
  return {
    configName:
      inputFlags.configName && inputFlags.configName.length > 0
        ? inputFlags.configName
        : ['tsconfig.json'],
    rootConfigName:
      inputFlags.rootConfigName && inputFlags.rootConfigName.length > 0
        ? inputFlags.rootConfigName
        : ['tsconfig.json'],
  }
}
