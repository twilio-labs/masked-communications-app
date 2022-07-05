import type { Request, Response } from "express";

export const post = async (
  req: Request<{}, {}, ConversationsPostEventBody>,
  res: Response
) => {};

interface ConversationsPostEventBody {}
