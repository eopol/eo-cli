import { resolve } from 'node:path'
import Package from '@eo-cli/package'
import { logger } from '@eo-cli/utils'
import { DEFAULT_CLI_PACKAGE_DEPENDENCIES_DIR_NAME } from '@eo-cli/constants'
import pkg from '../package.json'

const COMMAND_PACKAGE_MAP: Record<string, string> = {
  // init: '@google-translate-select/constants', // 测试安装
  init: '@eo-cli/init',
}

/**
 * @description 动态执行命令
 * 1. 如果命令行传入 packagePath 参数则通过动态加载本地文件的方式（getBootstrapFilePath）来执行本地的 package 函数
 * 2. 如果没有传入 packagePath 则去根目录缓存文件中查找 package，如果有则更新，没有就安装
 * @param args
 */
async function exec(...args: any[]) {
  let packagePath = process.env.CLI_PACKAGE_PATH ?? ''
  const packageHomePath = process.env.CLI_PACKAGE_HOME_PATH ?? ''
  let packageHomeNodeModulesPath = ''
  // const logLevel = process.env.CLI_LOG_LEVEL
  let packageInstance: Package | null = null

  logger.debug(`CLI_PACKAGE_PATH: ${packagePath}`, pkg.name)
  logger.debug(`CLI_PACKAGE_HOME_PATH: ${packageHomePath}`, pkg.name)
  // logger.debug(`CLI_LOG_LEVEL: ${logLevel}`, pkg.name)

  const command = args[args.length - 1]
  const commandName: string = command.name()
  const packageName = COMMAND_PACKAGE_MAP[commandName]
  // console.log(command.opts().force)
  const packageVersion = 'latest'

  if (!packagePath) {
    packagePath = resolve(
      packageHomePath,
      DEFAULT_CLI_PACKAGE_DEPENDENCIES_DIR_NAME
    )

    packageHomeNodeModulesPath = resolve(packagePath, 'node_modules')

    logger.debug(`packagePath: ${packagePath}`, pkg.name)
    logger.debug(
      `packageHomeNodeModulesPath: ${packageHomeNodeModulesPath}`,
      pkg.name
    )

    packageInstance = new Package(
      packagePath,
      packageName,
      packageVersion,
      packageHomeNodeModulesPath
    )

    if (await packageInstance.exists()) {
      // 更新 package
      await packageInstance.update()
    } else {
      // 安装 package
      await packageInstance.install()
    }
  } else {
    packageInstance = new Package(packagePath, packageName, packageVersion)
  }

  const bootstrapFilePath = await packageInstance.getBootstrapFilePath()
  if (bootstrapFilePath) {
    const pkgFileModule = await import(resolve(bootstrapFilePath))
    // 在当前进程中调用
    // pkgFileModule.default(args) // args 此时是 arguments 类数组，而动态载入的包中需要参数列表，需要使用 apply 来对 arguments 做转换
    pkgFileModule.default.apply(null, args)
    // TODO: 在 node 子进程调用
  }
}

export default exec
