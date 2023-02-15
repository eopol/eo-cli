import Command from '@eo-cli/command'
import { logger } from '@eo-cli/utils'
import pkg from '../package.json'

/**
 * @description init 命令
 *
 * 注意：
 * 1. 命令行参数不传的话为 undefined，需要转为对应类型见 line:13/line:14
 */
export class InitCommand extends Command {
  projectName!: string
  force!: boolean

  init() {
    this.projectName = this.options[0] || ''
    this.force = !!this.options[1].force
    console.log(this.projectName, this.force)
    logger.debug(`projectName: ${this.projectName}`, pkg.name)
    logger.debug(`force: ${this.force}`, pkg.name)
    console.log(logger.debug(`force: ${this.force}`, pkg.name))
  }

  exec() {
    console.log('InitCommand 业务逻辑')
  }
}

/**
 * @description init 命令执行逻辑
 * @param options [projectName: string, options: Record<string, any>, CommandInstance]
 * @returns
 */
function init(options: any[]) {
  // console.log(
  //   `init: ${projectName}, ${options.force}, ${process.env.CLI_PACKAGE_PATH}`
  // )
  return new InitCommand(options)
}

export default init
