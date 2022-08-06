import type { Request, Response } from 'express'
import { generateTwiml } from '../services/inboundCall.service'

export const post = async (
  req: Request,
  res: Response
) => {
  const from = req.body.From
  const to = req.body.Called

  const twiml = await generateTwiml(from, to)

  res.set('Content-Type', 'text/xml')
  res.send(twiml.toString())
}
