import type { Request, Response } from "express";

export const _delete = async (
  req: Request<{}, {}, SessionDeleteBody>,
  res: Response
) => {};

interface SessionDeleteBody {}

export const post = async (
  req: Request<{}, {}, SessionPostBody>,
  res: Response
) => {};

interface SessionPostBody {}
