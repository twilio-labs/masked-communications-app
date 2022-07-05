import { Router } from "express";
import * as controllers from "../controllers";

const router = Router();

router.post(
  "/conversations-post-event",
  controllers.conversationsPostEvent.post
);

router.post("/conversations-pre-event", controllers.conversationsPreEvent.post);

router.post("/inbound-call", controllers.inboundCall.post);

router.delete("/sessions", controllers.session._delete);
router.post("/sessions", controllers.session.post);

export default router;
