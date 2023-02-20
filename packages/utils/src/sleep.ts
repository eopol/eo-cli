/**
 * @description 手动休眠
 * @param timeout
 * @returns
 */
export function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}
