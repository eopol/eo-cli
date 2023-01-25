import {
  versionGreaterThan,
  /*versionSatisfies,*/ versionSorted,
} from './version'

/**
 * @description 获取 npm 包信息
 * @param name
 * @param registry
 * @returns
 */
export async function getNpmInfo(name: string, registry?: string) {
  if (!name) return null
  const npmRegistry = registry ?? getNpmDefaultRegistry()
  const url = new URL(`${npmRegistry}/${name}`)

  let data: Record<string, any> | null = null
  try {
    const response = await fetch(url)
    if (response.ok) {
      data = await response.json()
    }
    return data
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * @description 设置 npm 源，默认淘宝源
 * @param isOrigin
 * @returns
 */
function getNpmDefaultRegistry(isOrigin = false) {
  return isOrigin
    ? 'https://registry.npmjs.org'
    : 'https://registry.npmmirror.com'
}

/**
 * @description 调用 npm api，获取该包下包含所有版本号的列表
 * @param name
 * @param registry
 * @returns
 */
async function getNpmInfoVersions(name: string, registry?: string) {
  const npmInfo = await getNpmInfo(name, registry)

  if (npmInfo) {
    return Object.keys(npmInfo.versions)
  } else {
    return []
  }
}

/**
 * @description 将本地安装的版本与 npm 返回的全部版本对比返回大于当前版本的版本数组
 * @param currentVersion
 * @param versions
 * @returns
 */
function getNpmSatisfyVersion(currentVersion: string, versions: string[]) {
  // TODO: 跨主/次版本是否提示？
  // const npmSatisfyVersions = versions.filter((version) =>
  //   /*(version, `^${currentVersion}`)
  // )

  const sortVersions = versionSorted(versions)
  const npmSatisfyVersions = sortVersions.filter((version) =>
    versionGreaterThan(version, currentVersion)
  )

  return npmSatisfyVersions
}

/**
 * @description 获取最新的版本号
 * @param currentVersion
 * @param name
 * @param registry
 * @returns
 */
export async function getNpmLatestVersion(
  currentVersion: string,
  name: string,
  registry?: string
) {
  const versions = await getNpmInfoVersions(name, registry)
  const npmSatisfyVersions = getNpmSatisfyVersion(currentVersion, versions)
  let latestVersion = ''

  if (npmSatisfyVersions.length > 0) {
    latestVersion = npmSatisfyVersions[0]
  }

  return latestVersion
}
