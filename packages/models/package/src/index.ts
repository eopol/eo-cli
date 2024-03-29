import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  formatPath,
  getNpmDefaultRegistry,
  getNpminstallPackageLatestVersion,
  packageDirectorySync,
  pathExistsSync,
} from '@eo-cli/utils'
import npminstall from 'npminstall'
import { mkdirp } from '@liuli-util/fs-extra'
import pkg from '../package.json'

/**
 * @description 动态安装 command package/template package
 * 1. command package 如果传入 -pkg/--packagePath 则使用传入的路径下文件；没传入的话去 npm 下载后执行
 * 2. template package 按照写死的数据（接口）去 npm 下载，下载完毕后 copy 到指定目录即可
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
  /**
   * @description 获取本地缓存文件 .store 下携带版本号的 package path，这里的 .store 目录是 npminstall 写死在代码里的
   * @param packageName
   * @param packageVersion
   * @returns
   */
  getStorePackagePath(
    cachePath: string,
    packageName: string,
    packageVersion: string
  ) {
    return resolve(
      cachePath,
      '.store',
      `${packageName.replace('/', '+')}@${packageVersion}`
    )
  }
  /**
   * @description 如果没有本地缓存文件则手动创建
   */
  createStoreDir() {
    if (
      this.packageHomeNodeModulesPath &&
      !pathExistsSync(this.packageHomeNodeModulesPath)
    ) {
      mkdirp(this.packageHomeNodeModulesPath)
    }
  }
  /**
   * @description 判断 package 是否存在
   */
  async exists() {
    if (this.packageHomeNodeModulesPath) {
      // 根目录缓存文件的包
      this.createStoreDir()
      return pathExistsSync(
        resolve(this.packageHomeNodeModulesPath, this.packageName)
      )
    } else {
      // 本项目中的包
      return pathExistsSync(this.packagePath)
    }
  }
  /**
   * @description 获取包的最新版本号，因为 npminstall 要用
   */
  async getPackageLatestVersion() {
    if (this.packageVersion === 'latest') {
      const packageVersion = await getNpminstallPackageLatestVersion(
        this.packageName
      )

      if (packageVersion) {
        this.packageVersion = packageVersion
      } else {
        throw new Error(
          `[${pkg.name}: getNpminstallPackageLatestVersion] 获取最新版本号出错`
        )
      }
    }
  }
  /**
   * @description 安装 package
   */
  async install() {
    await this.getPackageLatestVersion()
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
  async update() {
    // 获取最新版本
    const latestPackageVersion = await getNpminstallPackageLatestVersion(
      this.packageName
    )
    if (!latestPackageVersion) {
      throw new Error(
        `[${pkg.name}: getNpminstallPackageLatestVersion] 获取最新版本号出错`
      )
    }

    // 查询最新版本号对应的本地缓存包路径是否存在
    if (
      this.packageHomeNodeModulesPath &&
      pathExistsSync(resolve(this.packageHomeNodeModulesPath, '.store'))
    ) {
      const latestPackagePath = this.getStorePackagePath(
        this.packageHomeNodeModulesPath,
        this.packageName,
        latestPackageVersion
      )

      // 如果不存在则安装最新版本
      if (!pathExistsSync(latestPackagePath)) {
        await npminstall({
          root: resolve(this.packagePath),
          storeDir: resolve(this.packageHomeNodeModulesPath),
          registry: getNpmDefaultRegistry(),
          pkgs: [
            {
              name: this.packageName,
              version: latestPackageVersion,
            },
          ],
        })
        // 安装成功后更新 package version
        this.packageVersion = latestPackageVersion
      } else {
        this.packageVersion = latestPackageVersion
      }
    }
  }
  /**
   * @description 获取入口文件路径
   * 1. 获取 package.json 所在的目录 => 使用 pkg-dir
   * 2. 读取 package.json => require()/其他
   * 3. 寻找 module/main => path
   * 4. 路径兼容（macos/windows）
   */
  async getBootstrapFilePath() {
    async function _getBootstrapFilePath(path: string) {
      // 兼容 packages/commands/init 与 packages/commands/init/src 最终指向 packages/commands/init
      const dir = packageDirectorySync({ cwd: path })

      if (!dir) return null
      const pkgFileModule = await import(
        pathToFileURL(resolve(dir, 'package.json')) as any,
        {
          assert: {
            type: 'json',
          },
        }
      )
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

    if (this.packageHomeNodeModulesPath) {
      const sourcePath = resolve(
        this.getStorePackagePath(
          this.packageHomeNodeModulesPath,
          this.packageName,
          this.packageVersion
        ),
        'node_modules',
        this.packageName
      )
      return _getBootstrapFilePath(sourcePath)
    } else {
      return _getBootstrapFilePath(this.packagePath)
    }
  }
}

export default Package
