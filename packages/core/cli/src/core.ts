import { Command } from 'commander'
import { logger, loggerOptionSetter } from '@eo-cli/utils'
// import commandInitActionHandler from '@eo-cli/init'
import exec from '@eo-cli/exec'
import pkg from '../package.json'
import perpare from './perpare'

export interface ProgramOptions {
  [x: string]: any
  debug?: boolean
  packagePath?: string
}

const program = new Command()

async function core(args: string[]) {
  logger.debug(`${pkg.name} 命令行参数为：${args}`, pkg.name)

  try {
    await perpare()
    registerCommand()
  } catch (error: any) {
    logger.error(error.message, pkg.name)

    if (program.opts<ProgramOptions>().debug) {
      console.log(error)
    }
  }
}

function registerCommand() {
  const { bin, version } = pkg
  const name = Object.keys(bin)[0]

  program
    .name(name)
    .description(`欢迎使用 ${pkg.name}，本地版本为：${pkg.version} 👋👋👋`)
    .usage('<command> [options]')
    // 修改默认值
    .version(version, '-v, --version', '查看版本号')
    .helpOption('-h, --help', '查看使用说明')
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-pkg, --packagePath <packagePath>', '是否指定本地调试包路径', '')

  program
    .command('init [projectName]')
    .option('-f --force', '是否强制初始化项目') // 覆盖同名项目
    // .action(commandInitActionHandler)
    .action(exec)

  // see https://github.com/tj/commander.js/issues/1517
  program.on('option:debug', () => {
    checkDebugArg(program.opts<ProgramOptions>().debug)
  })

  program.on('option:packagePath', () => {
    checkPackagePathArg(program.opts<ProgramOptions>().packagePath)
  })

  // see https://github.com/tj/commander.js/issues/1609
  // program.on('command:*', (operands) => {
  //   console.error(`error: unknown command '${operands[0]}'`)
  // })
  program.showHelpAfterError('(输入 --help 获取使用说明)') // 代替上面监听全局 command 捕捉错误

  // console.log(program)
  program.parse(process.argv)
}

/**
 * @description 满足 --debug 模式，开启 debug 模式后，日志会全部展示
 * 1. 根据传入的参数来确定 log 的级别
 */
function checkDebugArg(debug?: boolean) {
  if (debug) {
    process.env.CLI_LOG_LEVEL = 'Verbose'
  } else {
    process.env.CLI_LOG_LEVEL = 'Info'
  }

  loggerOptionSetter({
    instance: logger,
    levelName: process.env.CLI_LOG_LEVEL,
  })
}

/**
 * @description 开启本地调试动态安装包
 * @param packagePath 指定的包路径
 */
function checkPackagePathArg(packagePath?: string) {
  if (packagePath) {
    process.env.CLI_PACKAGE_PATH = packagePath
  } else {
    process.env.CLI_PACKAGE_PATH = ''
  }
}

export default core
