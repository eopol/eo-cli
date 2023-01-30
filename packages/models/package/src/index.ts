import { resolve } from 'node:path'
import {
  formatPath,
  getNpmDefaultRegistry,
  getNpminstallPackageLatestVersion,
  packageDirectorySync,
  pathExistsSync,
} from '@eo-cli/utils'
import npminstall from 'npminstall'

/**
 * @description 动态安装 command package
 */
class Package {
  constructor(
    /** package 路径 */
    public packagePath: string,
    /** package 名称，可以直接从 npm 下载 */
    public packageName: string,
    /** package 版本 */
    public packageVersion: string,
    /** package 本地安装后的路径对应  */
    public packageHomeNodeModulesPath?: string
  ) {}

  async perpare() {
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpminstallPackageLatestVersion(
        this.packageName
      )
    }
  }
  /**
   * @description 判断 package 是否存在
   */
  async exists() {
    if (this.packageHomeNodeModulesPath) {
      await this.perpare()
    } else {
      return pathExistsSync(this.packagePath)
    }
  }
  /**
   * @description 安装 package
   */
  async install() {
    await this.perpare()
    if (this.packagePath && this.packageHomeNodeModulesPath) {
      return npminstall({
        root: resolve(this.packagePath),
        storeDir: resolve(this.packageHomeNodeModulesPath),
        registry: getNpmDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: this.packageVersion,
          },
        ],
      })
    }
  }
  /**
   * @description 更新 package
   */
  update() {
    console.log('update')
  }
  /**
   * @description 获取入口文件路径
   * 1. 获取 package.json 所在的目录 => 使用 pkg-dir
   * 2. 读取 package.json => require()/其他
   * 3. 寻找 module/main => path
   * 4. 路径兼容（macos/windows）
   */
  async getBootstrapFilePath() {
    // 兼容 packages/commands/init 与 packages/commands/init/src 最终指向 packages/commands/init
    const dir = packageDirectorySync({ cwd: this.packagePath })

    if (!dir) return null
    const pkgFileModule = await import(resolve(dir, 'package.json'), {
      assert: {
        type: 'json',
      },
    })
    const pkgFile = pkgFileModule.default
    if (pkgFile && pkgFile.module) {
      const path = resolve(dir, pkgFile.module)
      if (pathExistsSync(path)) {
        return formatPath(path)
      } else {
        return null
      }
    } else {
      return null
    }
  }
}

export default Package
