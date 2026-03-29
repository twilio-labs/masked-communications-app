import { Router } from 'express'
import * as controllers from '../controllers'

import twilio from 'twilio'
import { webhookConfig } from '../config/webhookValidationConfig'

import basicAuth from 'express-basic-auth'
const { AUTH_USERNAME, AUTH_PASSWORD } = process.env

// Validate authentication credentials at startup
if (!AUTH_USERNAME || !AUTH_PASSWORD) {
  throw new Error('AUTH_USERNAME and AUTH_PASSWORD environment variables are required for /sessions endpoint')
}

const router = Router()

router.post('/conversations-post-event', twilio.webhook(webhookConfig), controllers.conversationsPostEvent.post)

router.post('/inbound-call', twilio.webhook(webhookConfig), controllers.inboundCall.post)

router.post('/recording-status', twilio.webhook(webhookConfig), controllers.recordingStatus.post)

router.post('/transcription-status', twilio.webhook(webhookConfig), controllers.transcriptionStatus.post)

router.post('/sessions', basicAuth({
  users: { [AUTH_USERNAME]: AUTH_PASSWORD }
}), controllers.session.post)

export default router
