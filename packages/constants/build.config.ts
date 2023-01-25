import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  tsconfig: '../../tsconfig.node.json',
  dts: {
    compilerOptions: {
      // use tsconfig references generate .d.ts has error. see https://github.com/egoist/tsup/issues/647
      composite: false,
    },
  },
  target: 'node18',
  minify: !options.watch,
}))
