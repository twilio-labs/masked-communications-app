import { Router } from "express";
import * as controllers from "../controllers";

import twilio from 'twilio'
import { webhookConfig } from '../config/webhookValidationConfig'

import basicAuth from 'express-basic-auth'
const { AUTH_USERNAME, AUTH_PASSWORD } = process.env

const router = Router();

router.post("/conversations-post-event", twilio.webhook(webhookConfig), controllers.conversationsPostEvent.post);

router.post("/inbound-call", twilio.webhook(webhookConfig), controllers.inboundCall.post);
router.post("/join-conference", twilio.webhook(webhookConfig), controllers.joinConference.get)

router.post("/sessions", basicAuth({
  users: { [AUTH_USERNAME]:AUTH_PASSWORD}
}), controllers.session.post);

export default router;
