export function commandInitActionHandler(
  projectName: string,
  options: Record<string, any>
) {
  console.log(`command init name: ${projectName}, arg: ${options.force}`)
}
