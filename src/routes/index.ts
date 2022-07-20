import { Router } from "express";
import * as controllers from "../controllers";
import basicAuth from 'express-basic-auth'

const { AUTH_USERNAME, AUTH_PASSWORD } = process.env

const router = Router();

router.post("/conversations-post-event", controllers.conversationsPostEvent.post);

router.post("/inbound-call", controllers.inboundCall.post);
router.post("/join-conference", controllers.joinConference.get)

router.post("/sessions", basicAuth({
  users: { [AUTH_USERNAME]:AUTH_PASSWORD}
}), controllers.session.post);

export default router;
