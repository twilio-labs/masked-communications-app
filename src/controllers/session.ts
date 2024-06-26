import type { Request, Response } from 'express'
import { SessionPostBody } from '../@types/types'

import {
  getActiveProxyAddresses,
  matchAvailableProxyAddresses,
  addParticipantsToConversation
} from '../services/session.service'

import { createConversation, deleteConversation } from '../utils'

export const post = async (
  req: Request<{}, {}, SessionPostBody>,
  res: Response
) => {
  try {
    const phoneNumbers = req.body.addresses
    const activeProxyAddresses = await getActiveProxyAddresses(phoneNumbers)
    const proxyAddresses = await matchAvailableProxyAddresses(activeProxyAddresses)
    const conversation = await createConversation(req.body)

    try {
      await addParticipantsToConversation(conversation.sid, proxyAddresses)
      res.setHeader('content-type', 'application/json')
      return res.status(200).send(conversation)
    } catch (err) {
      await deleteConversation(conversation.sid)
      return res.status(500).send(`${conversation.sid} failed to create session: ${err}`)
    }
  } catch (err) {
    return res.status(500).send(`Failed to create session: ${err}`)
  }
}
