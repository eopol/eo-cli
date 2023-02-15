import { isArray, logger, versionGreaterThanOrEqual } from '@eo-cli/utils'
import {
  DEFAULT_CLI_PACKAGE_NAME,
  LOWEST_NODE_VERSION as lowestVersion,
} from '@eo-cli/constants'
import pkg from '../package.json'

class Command {
  /** Command 传递来的参数 */
  options: any[]
  /** Command 传递来的当前实例 */
  commandInstance: Record<string, any>

  constructor(options?: any[]) {
    // 因为这里的 error 在 core/exec/index.ts 捕获所以带上 pkg.name 方便定位错误
    if (!options) {
      throw new Error(`${pkg.name} Command 类初始化时参数不能为空`)
    }
    if (!isArray(options)) {
      throw new Error(`${pkg.name} Command 类初始化时参数必须为数组`)
    }
    if (options.length < 1) {
      throw new Error(`${pkg.name} Command 类初始化时参数必须为数组且长度大于0`)
    }

    this.options = options
    this.commandInstance = {}

    new Promise(() => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.fetchCommandArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      // 开始 promise 后属于独立的 micro task，错误要单独捕获
      chain.catch((error: any) => {
        logger.error(error.message, pkg.name)
      })
    })
  }

  fetchCommandArgs() {
    this.commandInstance = this.options[this.options.length - 1]
    this.options = this.options.slice(0, this.options.length - 1)
  }

  /**
   * @description 检查 node 版本号，避免某些方法不兼容不同的版本
   * 1. 获取当前 node 版本号
   * 2. 对比最低版本号
   */
  checkNodeVersion() {
    const currentVersion = process.version
    const isVersionGreaterThanOrEqual = versionGreaterThanOrEqual(
      currentVersion,
      lowestVersion
    )

    if (!isVersionGreaterThanOrEqual) {
      throw new Error(
        `${DEFAULT_CLI_PACKAGE_NAME} 需要安装 v${lowestVersion} 以上版本的 Node.js`
      )
    }
  }

  init() {
    throw new Error(`init 方法必须由子类实现`)
  }

  exec() {
    throw new Error(`exec 方法必须由子类实现`)
  }
}

export default Command
