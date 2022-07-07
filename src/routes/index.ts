import { Router } from "express";
import * as controllers from "../controllers";

const router = Router();

router.post("/conversations-pre-event", controllers.conversationsPreEvent.post);
router.post("/conversations-post-event", controllers.conversationsPostEvent.post);

router.post("/inbound-call", controllers.inboundCall.post);

router.post("/sessions", controllers.session.post);

export default router;
