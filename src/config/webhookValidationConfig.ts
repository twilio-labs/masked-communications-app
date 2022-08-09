function shouldValidate () {
  return process.env.NODE_ENV !== 'test'
}

export const webhookConfig = {
  protocol: 'https',
  host: process.env.DOMAIN,
  validate: shouldValidate()
}
