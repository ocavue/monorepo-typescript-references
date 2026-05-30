import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'monorepo-typescript-references': 'src/cli.ts',
  },
  deps: { onlyBundle: ['path-type'] },
  target: 'node18',
  format: ['esm'],
})
