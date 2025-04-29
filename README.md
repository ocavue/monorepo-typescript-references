# monorepo-typescript-references

A CLI tool to automatically manage TypeScript project references in monorepo projects.

## Installation

```bash
# npm
npm install monorepo-typescript-references

# yarn
yarn add monorepo-typescript-references

# pnpm
pnpm add monorepo-typescript-references
```

## Usage

```bash
# Check if tsconfig references are up-to-date
monorepo-typescript-references check

# Update tsconfig references across the monorepo
monorepo-typescript-references fix
```

### Options

- `--configName`: Specify the name of the tsconfig file in each package (default: `tsconfig.json`)
- `--rootConfigName`: Specify the name of the tsconfig file in the monorepo root (default: `tsconfig.json`)

## How It Works

Consider a monorepo with the following structure:

```
my-monorepo/
├── apps/
│   └── my-app/
│       ├── package.json  # depends on @my-org/pkg-1 and @my-org/pkg-2
│       └── tsconfig.json
├── packages/
│   ├── pkg-1/
│   │   ├── package.json  # depends on @my-org/pkg-2
│   │   └── tsconfig.json
│   └── pkg-2/
│       ├── package.json
│       └── tsconfig.json
└── package.json
```

When you run `monorepo-typescript-references fix`, it will update the tsconfig.json files to ensure proper TypeScript project references:

```diff
// apps/my-app/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
+  "references": [
+    { "path": "../../packages/pkg-1/tsconfig.json" }
+    { "path": "../../packages/pkg-2/tsconfig.json" }
+  ]
}
```

```diff
// packages/pkg-1/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
+  "references": [
+    { "path": "../pkg-2/tsconfig.json" }
+  ]
}
```

This ensures TypeScript compiles the packages in the correct order based on the dependency graph.

## License

MIT
