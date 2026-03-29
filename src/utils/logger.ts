import pino from 'pino'

const level = process.env.LOG_LEVEL || 'info'

export const logger = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.NODE_ENV !== 'production',
      singleLine: process.env.NODE_ENV === 'production',
      translateTime: 'SYS:standard'
    }
  }
})

export default logger
