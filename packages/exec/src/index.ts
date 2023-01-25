export default function exec() {
  console.log('CLI_LOG_LEVEL: ', process.env.CLI_LOG_LEVEL)
  console.log('CLI_HOME: ', process.env.CLI_HOME)
  console.log('CLI_TARGET_PATH: ', process.env.CLI_TARGET_PATH)
}
