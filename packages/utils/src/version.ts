import semver from 'semver'

/**
 * @description Greater than, see https://github.com/npm/node-semver#ranges
 * @param baseVersion
 * @param targetVersion
 * @returns
 */
export function versionGreaterThan(baseVersion: string, targetVersion: string) {
  return semver.gt(baseVersion, targetVersion)
}

/**
 * @description Greater than or equal to, see https://github.com/npm/node-semver#ranges
 * @param baseVersion
 * @param targetVersion
 * @returns
 */
export function versionGreaterThanOrEqual(
  baseVersion: string,
  targetVersion: string
) {
  return semver.gte(baseVersion, targetVersion)
}

/**
 * @description Less than, see https://github.com/npm/node-semver#ranges
 * @param baseVersion
 * @param targetVersion
 * @returns
 */
export function versionLessThan(baseVersion: string, targetVersion: string) {
  return semver.lt(baseVersion, targetVersion)
}

/**
 * @description Less than or equal to, see https://github.com/npm/node-semver#ranges
 * @param baseVersion
 * @param targetVersion
 * @returns
 */
export function versionLessThanOrEqual(
  baseVersion: string,
  targetVersion: string
) {
  return semver.lte(baseVersion, targetVersion)
}

/**
 * @description Range filter, see https://github.com/npm/node-semver#x-ranges-12x-1x-12-
 * @param baseVersion
 * @param targetVersion
 * @returns
 */
export function versionSatisfies(baseVersion: string, targetVersion: string) {
  return semver.satisfies(baseVersion, targetVersion)
}

export function versionRangeStr(versions: string[]) {
  if (!versions.length) return ''
  const sortVersions = versionSorted(versions)
  const versionRange = sortVersions.length
    ? `${sortVersions[sortVersions.length - 1]} - ${sortVersions[0]}`
    : ''
  return versionRange
}

/**
 * @description 倒序排列版本号
 * @param versions
 * @returns
 */
export function versionSorted(versions: string[]) {
  if (!versions.length) return []
  return versions.sort((a, b) => (semver.gt(b, a) ? 1 : -1))
}
