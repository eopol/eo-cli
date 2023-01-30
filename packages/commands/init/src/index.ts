function init(projectName: string, options: Record<string, any>) {
  console.log(
    `init: ${projectName}, ${options.force}, ${process.env.CLI_PACKAGE_PATH}`
  )
}

export default init
