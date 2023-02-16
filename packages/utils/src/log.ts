import consola from 'consola'
import chalk from 'chalk'
import type { Consola, ConsolaLogObject, logType } from 'consola'
import type { ColorName } from 'chalk'

// copy from consola LogLevel
enum LogLevel {
  Fatal = 0,
  Error = 0,
  Warn = 1,
  Log = 2,
  Info = 3,
  Success = 3,
  // Ready = 3,
  // Start = 3,
  Debug = 4,
  Trace = 5,
  // Verbose = 5,
  // Silent = -1,
  Verbose = Infinity,
  Silent = -Infinity,
}

type LogInfoKey = Exclude<logType, 'silent' | 'verbose'>

interface LogInfoValue {
  emoji: string
  color: ColorName
  textBold: boolean
}

const LOG_INFO: Record<LogInfoKey, LogInfoValue> = {
  fatal: {
    emoji: '',
    color: 'red',
    textBold: true,
  },
  error: {
    emoji: '',
    color: 'red',
    textBold: true,
  },
  warn: {
    emoji: '',
    color: 'yellow',
    textBold: true,
  },
  log: {
    emoji: '📝',
    color: 'white',
    textBold: true,
  },
  info: {
    emoji: '👀',
    color: 'cyan',
    textBold: true,
  },
  start: {
    emoji: '🚗',
    color: 'magenta',
    textBold: true,
  },
  success: {
    emoji: '🎉',
    color: 'green',
    textBold: true,
  },
  ready: {
    emoji: '🎯',
    color: 'blue',
    textBold: true,
  },
  debug: {
    emoji: '🔎',
    color: 'gray',
    textBold: true,
  },
  trace: {
    emoji: '🔎',
    color: 'gray',
    textBold: true,
  },
}

const CONSOLA_DEFAULT_OPTIONS: Record<string, any> = {
  level: LogLevel['Info'],
  defaults: {
    badge: true,
  },
}

function logCreator(param: {
  withPkgName: boolean
  openEmoji?: boolean
  emojiPos?: 'prev' | 'post'
}): Consola {
  const _consola = consola.create(CONSOLA_DEFAULT_OPTIONS)
  const { withPkgName, openEmoji = false, emojiPos = 'post' } = param

  for (const [type, info] of Object.entries(LOG_INFO)) {
    const _logType = type as LogInfoKey
    const { emoji, color, textBold } = info
    const consolaLogInvoker = _consola[_logType]

    _consola[_logType] = (
      message: ConsolaLogObject | any,
      pkgName?: string
    ) => {
      let content = message
      if (openEmoji && emoji) {
        if (emojiPos === 'post') {
          content = `${content} ${emoji}`
        } else {
          content = `${emoji} ${content}`
        }
      }

      let _chalk = chalk
      if (color) {
        _chalk = _chalk[color]
      }
      if (textBold) {
        _chalk = _chalk['bold']
      }

      if (withPkgName) {
        if (pkgName) {
          _consola.withTag(`${pkgName}`)[_logType](_chalk(content))
        } else {
          consolaLogInvoker(_chalk(content))
        }
      } else {
        consolaLogInvoker(_chalk(content))
      }
    }
  }

  return _consola
}

export function loggerOptionSetter(param: {
  instance: Consola
  levelName?: 'Info' | 'Verbose'
}): Consola {
  const {
    instance,
    levelName = process.env.CLI_LOG_LEVEL as 'Info' | 'Verbose',
  } = param
  instance.level = LogLevel[levelName]
  return instance
}

export const logger = logCreator({
  withPkgName: true,
  openEmoji: false,
})
