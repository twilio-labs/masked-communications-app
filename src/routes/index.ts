import { Router } from "express";

const router = Router();

router.post("/sessions", async (req, res) => {});
router.delete("/sessions", async (req, res) => {});

router.post("/conversations-pre-event", async (req, res) => {
  // onConversationAdd
});

router.post("/conversations-post-event", async (req, res) => {
  // onConversationStateUpdated
});

router.post("/inbound-call", async (req, res) => {});

export default router;
