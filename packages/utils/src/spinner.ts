import ora from 'ora'

/**
 * @description 命令行加载动画
 * @param text 加载提示
 * @param interval 动画时常毫秒
 * @returns
 */
export function spinner(
  text = '正在执行，请稍等',
  interval = 80,
  frames = ['|', '/', '-', '\\']
) {
  const loading = ora({
    text,
    spinner: {
      interval,
      frames,
    },
  })

  return loading
}
