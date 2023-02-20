import { spawn } from 'node:child_process'
import type { SpawnOptions } from 'node:child_process'

/**
 * @description 重新包装 spawn，兼容 windows
 * @param command
 * @param args
 * @param options
 * @returns
 */
export function unifiedSpawn(
  command: string,
  args: readonly string[],
  options: SpawnOptions
) {
  const isWin = process.platform === 'win32'
  const _command = isWin ? 'cmd' : command
  const _args = isWin ? ['/c'].concat(command, args) : args
  return spawn(_command, _args, options || {})
}

/**
 * @description 使用 promise 包装 unifiedSpawn
 * @param command
 * @param args
 * @param options
 * @returns
 */
export function unifiedSpawnAsync(
  command: string,
  args: readonly string[],
  options: SpawnOptions
) {
  return new Promise((resolve, reject) => {
    const cp = unifiedSpawn(command, args, options)
    cp.on('error', (data) => {
      reject(data)
    })
    cp.on('exit', (data) => {
      resolve(data)
    })
  })
}
