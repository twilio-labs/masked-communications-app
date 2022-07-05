import type { Request, Response } from "express";

export const post = async (
  req: Request<{}, {}, ConversationsPreEventBody>,
  res: Response
) => {};

interface ConversationsPreEventBody {}
