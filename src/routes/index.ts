import { Router } from "express";
import client from "../services/twilio.service";

const router = Router();

router.use("/participants", (req, res, next) => {
  res.json({ hello: "world" });
});

export default router;
