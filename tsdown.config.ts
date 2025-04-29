import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'monorepo-typescript-references': 'src/cli.ts',
  },
  target: 'node12',
  format: ['esm'],
})
