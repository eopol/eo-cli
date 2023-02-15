import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
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
    try {
      // const pkgFileModule = await import(resolve(bootstrapFilePath))
      // // 在当前进程中调用
      // // pkgFileModule.default(args) // args 此时是 arguments 类数组，而动态载入的包中需要参数列表，需要使用 apply 来对 arguments 做转换
      // // pkgFileModule.default.apply(null, args)
      // pkgFileModule.default.call(null, Array.from(args))

      // 在 node 子进程调用
      const _args = Array.from(args)
      // 简化 Command 实例对象，减少内存占用
      const commandInstance: Record<string, any> = _args[_args.length - 1]
      const _commandInstance = Object.keys(commandInstance).reduce(
        (result: any, key: string) => {
          if (
            // eslint-disable-next-line no-prototype-builtins
            commandInstance.hasOwnProperty(key) &&
            !key.startsWith('_') &&
            key !== 'parent'
          ) {
            result[key] = commandInstance[key]
          }
          return result
        },
        Object.create(null) // 创建无原型链数据的对象
      )
      _args[_args.length - 1] = _commandInstance

      // 构造可执行的 eval 字符串
      const code = `(await import('${resolve(
        bootstrapFilePath
      )}')).default.call(null, ${JSON.stringify(_args)})`
      // 不设置 --input-type=module 会报错，eval 不支持 import/export，node 内部自动转化。see: http://nodejs.cn/api/cli.html#--input-typetype
      const child = spawn('node', ['--input-type=module', '--eval', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      })

      child.on('error', (error: Error) => {
        logger.error(`子进程执行出错 ${error.message}`, pkg.name)
        process.exit(1) // 1 表示返回错误, 0 表示成功
      })

      child.on('exit', (e: number | null) => {
        logger.debug(e === 0 ? '子进程正常结束' : '子进程异常结束', pkg.name) // e => 0
        e && process.exit(e)
      })
    } catch (error: any) {
      logger.error(error.message, pkg.name)
    }
  }
}

export default exec
