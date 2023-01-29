import Package from '@eo-cli/package'
import { logger } from '@eo-cli/utils'
import pkg from '../package.json'

const COMMAND_PACKAGE_MAP: Record<string, string> = {
  init: '@eo-cli/init',
}

export default async function exec(...args: any[]) {
  const homePath = process.env.CLI_HOME_PATH ?? ''
  let targetPath = process.env.CLI_TARGET_PATH ?? ''
  // const logLevel = process.env.CLI_LOG_LEVEL

  logger.debug(`CLI_HOME_PATH: ${homePath}`, pkg.name)
  logger.debug(`CLI_TARGET_PATH: ${targetPath}`, pkg.name)
  // logger.debug(`CLI_LOG_LEVEL: ${logLevel}`, pkg.name)

  const command = args[args.length - 1]
  const commandName: string = command.name()
  const packageName = COMMAND_PACKAGE_MAP[commandName]
  // console.log(command.opts().force)
  const packageVersion = 'latest'

  if (!targetPath) {
    // TODO:获取 package 缓存路径
    targetPath = ''
  }

  const packageInstance = new Package(targetPath, packageName, packageVersion)
  const filePath = await packageInstance.getBootstrapFilePath()
  console.log(filePath)
}
