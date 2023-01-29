import importLocal from 'import-local'
import { logger } from '@eo-cli/utils'
import core from './core'
import pkg from '../package.json'

if (importLocal(import.meta.url)) {
  logger.info(`${pkg.name} 正在使用本地版本`)
} else {
  core(process.argv.slice(2))
}
