import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import Command from '@eo-cli/command'
import {
  getNpminstallPackageLatestVersion,
  kebabCase,
  logger as loggerInstance,
  loggerOptionSetter,
  pathExistsSync,
  sleep,
  spinner,
  unifiedSpawnAsync,
  userHome,
} from '@eo-cli/utils'
import inquirer from 'inquirer'
import {
  copySync,
  emptyDirSync,
  ensureDirSync,
  writeFileSync,
} from '@liuli-util/fs-extra'
import semver from 'semver'
import Package from '@eo-cli/package'
import {
  DEFAULT_CLI_PACKAGE_HOME_PATH,
  DEFAULT_CLI_PACKAGE_TEMPLATE_DIR_NAME,
} from '@eo-cli/constants'
import fg from 'fast-glob'
import ejs from 'ejs'
import pkg from '../package.json'
import {
  CHOICES_LIST_ENUM,
  PROJECT_LIST,
  TEMPLATE_TYPE_ENUM,
  WHITE_PACKAGE_MANAGER,
} from './constants'
import type { Template, Templates } from './constants'

// 使用 spawn 创建子进程后 logger level 丢失，需重新挂载
const logger = loggerOptionSetter({
  instance: loggerInstance,
})

/**
 * @description init 命令
 *
 * 注意：
 * 1. 命令行参数不传的话为 undefined，需要转为对应类型见 line:13/line:14
 */
export class InitCommand extends Command {
  projectName!: string
  force!: boolean
  projectTemplates!: Templates
  inquirerResult!: Record<string, any> | undefined
  selectTemplate!: Template
  cachepackageInstance!: Package

  init() {
    this.projectName = this.options[0] || ''
    this.force = !!this.options[1].force
    logger.debug(
      `${pkg.name} 执行参数 projectName 值为 ${this.projectName}`,
      pkg.name
    )
    logger.debug(`${pkg.name} 执行参数 force 值为 ${this.force}`, pkg.name)
  }

  /**
   * @description init exec 执行逻辑
   * 1. 准备阶段
   * 2. 下载模版
   * 3. 按装模版
   */
  async exec() {
    try {
      const inquirerResult = await this.prepare()
      if (inquirerResult) {
        this.inquirerResult = inquirerResult
        logger.debug(JSON.stringify(inquirerResult), pkg.name)

        await this.downloadProjectTemplate()

        await this.installProjectTemplate()
      }
    } catch (error: any) {
      logger.error(error.message, pkg.name)

      // debug 模式下打印出调用栈方便排查问题
      if (process.env.CLI_LOG_LEVEL === 'Verbose') {
        console.log(error)
      }
    }
  }

  /**
   * @description 准备阶段逻辑
   * 1. 判断当前目录是否不为空
   * 2. 是否启动强制更新
   * 4. 创建项目或者组件
   * 3. 获取项目信息
   */
  async prepare() {
    // 判断项目模版是否存在, TODO:通过接口获取数据
    // 1. 通过项目模版 api 获取项目模版信息
    // 1.1 通过 egg.js 搭建一套后端系统提供 api
    // 1.2 通过 npm 存储项目模版（基于 vite 无任何依赖的模版 / vben 中后台模版）
    // 1.3 将项目信息存储到 mongodb
    // 1.4 通过 egg.js 获取 mongodb 数据通过 api 返回

    // 目前不用 1.1/1.3/1.4 把信息存放在同级目录下的 constants 中，缺点就是每次发 template 都得发包
    // 数据放在 db 中只需要将模版发布至 npm 后更改 db 数据即可，通过接口就能获得最新数据
    const projectTemplates = PROJECT_LIST
    if (!projectTemplates || projectTemplates.length === 0) {
      throw new Error('项目模版不存在')
    }
    this.projectTemplates = projectTemplates

    const localPath = process.cwd()
    if (this.isLocalPathDirNotEmpty(localPath)) {
      let localPathDirNotEmptyContinue = true
      // 如果传入 -f/--force 则越过该提示
      if (!this.force) {
        // 询问是否继续创建
        localPathDirNotEmptyContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'localPathDirNotEmptyContinue',
            message: '当前文件夹不为空，是否继续创建项目？',
            default: false,
          })
        ).localPathDirNotEmptyContinue

        if (!localPathDirNotEmptyContinue) return
      }

      if (localPathDirNotEmptyContinue) {
        // 因为清空（删除）风险太大有必要做二次确认
        const {
          confirmDelete,
        }: {
          confirmDelete: boolean
        } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          message: '是否确认清空当前目录下已存在的文件？',
          default: false,
        })

        if (confirmDelete) {
          // 强制更新，清空当前目录
          emptyDirSync(localPath)
        } else {
          return
        }
      }
    }
    return this.getInquirerResult()
  }

  /**
   * @description 判断当前目录是否不为空
   * @param localPath
   * @returns
   */
  isLocalPathDirNotEmpty(localPath: string) {
    let localPathDir = readdirSync(localPath)
    // 过滤 . 开头文件（.git/.vscode）与 node_modules 文件，因为这不影响项目创建
    localPathDir = localPathDir.filter(
      (fileName) =>
        !fileName.startsWith('.') && !fileName.includes('node_modules')
    )
    return localPathDir && localPathDir.length > 0
  }

  /**
   * @description 获取用户命令行交互信息
   * 1. 创建项目或者组件
   * 2. 获取项目信息
   * @returns
   */
  async getInquirerResult() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    let inquirerResult: Record<string, any> = {}
    // 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: 0, // 索引，并不是value
      choices: [
        {
          name: '项目',
          value: CHOICES_LIST_ENUM.project,
        },
        // {
        //   name: '组件',
        //   value: CHOICES_LIST_ENUM.component,
        // },
      ],
    })

    logger.debug(`init 选择初始化类型为 ${type}`, pkg.name)

    if (type === CHOICES_LIST_ENUM.project) {
      // 获取项目基本信息
      const projectNamePrompt = {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate(input: string) {
          // 添加校验失败提示，否则一直按回车没反应
          const done = (this as any).async()
          setTimeout(() => {
            if (!_this.isProjectNameVaild(input)) {
              done(
                `
                  请输入合法的项目名称 
                  ✅ a, a1, a-b1, a-b, a_b, aaa
                  ❌ a-, a_, a-1
                `
              )
              return
            }
            done(null, true)
          }, 0)
        },
        filter(answer: string) {
          return answer
        },
      }
      const projectPrompts = [
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '',
          validate(input: string) {
            // return !!semver.valid(input)

            // 添加校验失败提示，否则一直按回车没反应
            const done = (this as any).async()
            setTimeout(() => {
              if (!semver.valid(input)) {
                done(
                  `
                    请输入合法的项目名版本号
                    ✅ v1.0.0, 1.0.0
                    ❌ aa, 1, v1
                  `
                )
                return
              }
              done(null, true)
            }, 0)
          },
          filter(answer: string) {
            // semver 会将 v1.0.1 转为 1.0.0 所以这里要对结果做处理
            // 统一不带 v
            const version = semver.valid(answer)
            // semver.valid('aaa') => null 这里做判断
            if (version) {
              return version
            } else {
              return answer
            }
          },
        },
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模版',
          default: '',
          choices: this.createProjectTemplateChoices(),
        },
      ]

      // 判断通过命令行传入的 projectname 是否合规，如果合规直接使用，不合规展示 inquirer 输入
      if (!this.isProjectNameVaild(this.projectName)) {
        projectPrompts.unshift(projectNamePrompt)
      } else {
        inquirerResult['projectName'] = this.projectName
      }

      const result = await inquirer.prompt(projectPrompts)
      inquirerResult = {
        ...inquirerResult,
        ...result,
      }
    } else if (type === CHOICES_LIST_ENUM.component) {
      logger.warn('暂不提供组件初始化功能，敬请期待')
    }

    return this.hydrateEjsVariables(inquirerResult)
  }

  /**
   * @description 判断 projectname 是否合规
   * @param input
   * @returns
   */
  isProjectNameVaild(input: string) {
    // 1. 输入的首字符必为英文
    // 2. 尾字符必为英文或数字
    // 3. 字符仅允许 -/_
    // return /^[a-zA-Z]+[\w-]*[a-zA-Z0-9]$/.test(input)
    // return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
    //   input
    // ) // 兼容单英文
    return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
      input
    )
  }

  /**
   * @description 注入 ejs 模版需要的变量
   * @param inquirerResult
   * @returns
   */
  hydrateEjsVariables(inquirerResult: Record<string, any>) {
    // AbcFed => abc-fed
    if (inquirerResult.projectName) {
      inquirerResult.ejsName = kebabCase(inquirerResult.projectName).replace(
        /^-/,
        ''
      )
    }

    if (inquirerResult.projectVersion) {
      inquirerResult.ejsVersion = inquirerResult.projectVersion
    }

    return inquirerResult
  }

  /**
   * @description 下载项目模版
   */
  async downloadProjectTemplate() {
    if (this.inquirerResult) {
      const { projectTemplate } = this.inquirerResult
      const selectTemplate = this.projectTemplates.find(
        (template) => template.npmName === projectTemplate
      )

      const templatePath = resolve(
        userHome,
        DEFAULT_CLI_PACKAGE_HOME_PATH,
        DEFAULT_CLI_PACKAGE_TEMPLATE_DIR_NAME
      )
      const templateNodeModulesPath = resolve(templatePath, 'node_modules')

      logger.debug(`templatePath: ${templatePath}`, pkg.name)
      logger.debug(
        `templateNodeModulesPath: ${templateNodeModulesPath}`,
        pkg.name
      )

      if (selectTemplate) {
        this.selectTemplate = selectTemplate
        const { npmName, version } = this.selectTemplate
        const packageInstance = new Package(
          templatePath,
          npmName,
          version,
          templateNodeModulesPath
        )
        const loading = spinner()

        if (await packageInstance.exists()) {
          // 避免 npminstall 出错导致程序卡死（比如写一个不存在的版本号）
          try {
            loading.start('正在更新模版...')
            await sleep()
            // 更新 package
            await packageInstance.update() // template 开发完毕后需要给 npm 服务器一些时间，否则这里拿不到 npm 中的最新版本
          } catch (error: any) {
            throw new Error(error.message)
          } finally {
            loading.stop()
            if (await packageInstance.exists()) {
              // loading.succeed('模版更新成功！')
              logger.success('模版更新成功！', pkg.name)
              this.cachepackageInstance = packageInstance
            }
          }
        } else {
          // 避免 npminstall 出错导致程序卡死（比如写一个不存在的版本号）
          try {
            loading.start('正在下载模版...')
            await sleep()
            // 下载 package
            await packageInstance.install()
          } catch (error: any) {
            throw new Error(error.message)
          } finally {
            loading.stop()
            if (await packageInstance.exists()) {
              // loading.succeed('模版下载成功！')
              logger.success('模版下载成功！', pkg.name)
              this.cachepackageInstance = packageInstance
            }
          }
        }
      }
    } else {
      throw new Error('inquirer 回传数据出错')
    }
  }

  /**
   * @description 创建命令行交互需要的模版列表数据
   */
  createProjectTemplateChoices() {
    return this.projectTemplates.map((template) => ({
      name: `${template.name} [${template.npmName}]`,
      value: template.npmName,
    }))
  }

  /**
   * @description 安装项目模版
   */
  async installProjectTemplate() {
    if (this.selectTemplate) {
      if (!this.selectTemplate.type) {
        this.selectTemplate.type = TEMPLATE_TYPE_ENUM.normal
      } else {
        logger.debug(
          `init 项目模版类型为：${TEMPLATE_TYPE_ENUM[this.selectTemplate.type]}`
        )
        if (this.selectTemplate.type === TEMPLATE_TYPE_ENUM.normal) {
          await this.installNormalTemplate()
        } else if (this.selectTemplate.type === TEMPLATE_TYPE_ENUM.custom) {
          await this.installCustomTemplate()
        } else {
          throw new Error('项目模版信息无法识别')
        }
      }
    } else {
      throw new Error('项目模版信息不存在')
    }
  }

  async installNormalTemplate() {
    // 获取最新版本
    const latestPackageVersion = await getNpminstallPackageLatestVersion(
      this.cachepackageInstance.packageName
    )
    if (!latestPackageVersion) {
      throw new Error(
        `[${pkg.name}: getNpminstallPackageLatestVersion] 获取最新版本号出错`
      )
    }

    // 查询最新版本号对应的本地缓存包路径是否存在
    if (
      this.cachepackageInstance.packageHomeNodeModulesPath &&
      pathExistsSync(
        resolve(this.cachepackageInstance.packageHomeNodeModulesPath, '.store')
      )
    ) {
      const latestPackagePath = this.cachepackageInstance.getStorePackagePath(
        this.cachepackageInstance.packageHomeNodeModulesPath,
        this.cachepackageInstance.packageName,
        latestPackageVersion
      )

      // 拷贝模版代码至当前目录
      const loading = spinner()
      try {
        loading.start('正在安装模版...')
        await sleep()
        const templatePath = resolve(
          latestPackagePath,
          'node_modules',
          this.cachepackageInstance.packageName,
          'template'
        )
        logger.debug(`模版存储的真实路径为：${templatePath}`)
        const copiedPath = process.cwd()
        ensureDirSync(templatePath)
        ensureDirSync(copiedPath)
        copySync(templatePath, copiedPath)
      } catch (error: any) {
        throw new Error(error.message)
      } finally {
        loading.stop()
        logger.success('安装模版成功！', pkg.name)
      }

      await this.ejsRender()

      const { installCommand } = this.selectTemplate
      // 依赖安装
      if (installCommand && installCommand.length) {
        if (!this.checkPackageManager(installCommand)) {
          throw new Error(
            `包管理器不符合要求，包管理器白名单为：${WHITE_PACKAGE_MANAGER.join(
              ','
            )}`
          )
        }

        // TODO: 判断本地是否安装过 pnpm
        await this.execCommand(
          'npm install pnpm -g',
          '安装包管理器过程异常',
          '安装包管理器成功！'
        )

        await this.execCommand(
          installCommand,
          '安装依赖过程异常',
          '安装依赖成功！'
        )
      }

      // // 启动命令执行
      // if (startCommand && startCommand.length) {
      //   await this.execCommand(
      //     startCommand,
      //     '模版启动过程异常',
      //     '模版启动成功！'
      //   )
      // }

      console.log(`初始化成功，项目位于：${process.cwd()}\n`)
      console.log('请执行下列命令运行项目：\n')
      console.log('\x1B[4G%s', 'pnpm dev', '\n')
    }
  }

  checkPackageManager(_command: string) {
    const commandSplitResult = _command.split(' ')
    const command = commandSplitResult[0]
    return WHITE_PACKAGE_MANAGER.includes(command)
  }

  async execCommand(
    _command: string,
    errorMessage: string,
    successMessage: string
  ) {
    const commandSplitResult = _command.split(' ')
    const command = commandSplitResult[0]
    const args = commandSplitResult.slice(1)

    const execCommandResult = await unifiedSpawnAsync(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
    if (execCommandResult !== 0) {
      throw new Error(errorMessage)
    } else {
      logger.success(successMessage, pkg.name)
    }
  }

  async ejsRender() {
    const cwd = process.cwd()
    const { ignore = ['**/node_modules/**'] } = this.selectTemplate

    try {
      const files = await fg('*', {
        cwd,
        ignore,
        dot: true,
      })

      await Promise.all(
        files.map(async (file) => {
          const ejsResult = await ejs.renderFile(
            resolve(cwd, file),
            this.inquirerResult
          )
          writeFileSync(resolve(cwd, file), ejsResult)
        })
      )
    } catch (error: any) {
      throw new Error('ejs 模版渲染异常')
    }
  }

  async installCustomTemplate() {
    logger.warn('暂不提供自定义模版功能，敬请期待')
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
