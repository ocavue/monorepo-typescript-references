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

## License

MIT
