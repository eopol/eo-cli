import { resolve } from 'node:path'
import { formatPath, packageDirectorySync, pathExistsSync } from '@eo-cli/utils'

class Package {
  constructor(
    /** package 目标路径 */
    public targetPath: string,
    /** package 名称，可以直接从 npm 下载 */
    public packageName: string,
    /** package 版本 */
    public packageVersion: string
  ) {}
  /**
   * @description 判断 package 是否存在
   */
  exists() {
    console.log('exists')
  }
  /**
   * @description 安装 package
   */
  install() {
    console.log('install')
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
   * 3. 寻找 main/lib => path
   * 4. 路径兼容（macos/windows）
   */
  async getBootstrapFilePath() {
    // 兼容 packages/commands/init 与 packages/commands/init/src 最终指向 packages/commands/init
    const dir = packageDirectorySync({ cwd: this.targetPath })

    if (!dir) return null
    const pkgFileModule = await import(resolve(dir, 'package.json'), {
      assert: {
        type: 'json',
      },
    })
    const pkgFile = pkgFileModule.default
    if (pkgFile && pkgFile.main) {
      const path = resolve(dir, pkgFile.main)
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
