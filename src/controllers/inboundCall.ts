import type { Request, Response } from "express";

export const post = async (
  req: Request<{}, {}, InboundCallBody>,
  res: Response
) => {};

interface InboundCallBody {}
