declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /* 来自 consola 中的定义，详情见 consola LogLevel */
      LOG_LEVEL: 'Info' | 'Verbose'
      CLI_HOME: string
    }
  }
}

export {}
