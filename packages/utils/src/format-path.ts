import { sep } from 'node:path'

/**
 * @description 处理 macos 与 windows 路径分隔符
 * @param p
 * @returns
 */
export function formatPath(p: string) {
  if (sep === '/') {
    return p
  } else {
    // windows 下为 \ 需手动处理
    return p.replace(/\\/g, '/')
  }
}
