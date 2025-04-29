import { buildApplication, buildRouteMap } from '@stricli/core'

import {
  description,
  name,
  version,
} from '../package.json' with { type: 'json' }

import { checkCommand } from './commands/check'
import { fixCommand } from './commands/fix'

const routes = buildRouteMap({
  routes: {
    check: checkCommand,
    fix: fixCommand,
  },
  docs: {
    brief: description,
  },
})

export const app = buildApplication(routes, {
  name,
  versionInfo: {
    currentVersion: version,
  },
})
