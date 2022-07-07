import type { Request, Response } from "express";
import {
  SessionPostBody,
  SessionDeleteBody
} from "../@types/session.types";

import {
  getActiveProxyAddresses,
  matchAvailableProxyAddresses,
  createConversation,
  addParticipantsToConversation,
  deleteConversation } from "../services/session.service";

export const post = async (
  req: Request<{}, {}, SessionPostBody>,
  res: Response
) => {
  console.log(req.body);
  const phoneNumbers = req.body.addresses;
  const activeProxyAddresses = await getActiveProxyAddresses(phoneNumbers); 
  const proxyBindings = await matchAvailableProxyAddresses(activeProxyAddresses);
  const conversation = await createConversation(req.body)

  try {
    await addParticipantsToConversation(conversation.sid, proxyBindings)
    res.setHeader('content-type', 'application/json');
    return res.status(200).send(`${JSON.stringify(conversation)}`);
  } catch(err) {
    await deleteConversation(conversation.sid);
    return res.status(500).send(`${conversation.sid} failed to create session: ${err}`)
  }

};

export const _delete = async (
  req: Request<{}, {}, SessionDeleteBody>,
  res: Response
  ) => {
    
    const {
      EventType: eventType,
      State: state,
      ConversationSid: conversationSid
    } = req.body;
    
    if (eventType === "onConversationUpdated" && state === "closed") {
      try {
        await deleteConversation(conversationSid)
      } catch(err) {
        return res.status(500).send(`${conversationSid} failed to delete: ${err}`)
      }
      return res.status(200).send(`${conversationSid} deleted`)
    }
    return res.status(200).send('not processed')
  };