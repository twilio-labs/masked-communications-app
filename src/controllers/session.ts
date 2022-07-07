import type { Request, Response } from "express";
import { SessionPostBody } from "../@types/session.types";

import {
  getActiveProxyAddresses,
  matchAvailableProxyAddresses,
  addParticipantsToConversation, } from "../services/session.service";

import { deleteConversation } from "../utils/deleteConveresation.util";
import { createConversation } from "../utils/createConversation.util";

export const post = async (
  req: Request<{}, {}, SessionPostBody>,
  res: Response
) => {
  console.log(req.body);
  const phoneNumbers = req.body.addresses;
  const activeProxyAddresses = await getActiveProxyAddresses(phoneNumbers); 
  const proxyAddresses = await matchAvailableProxyAddresses(activeProxyAddresses);
  const conversation = await createConversation(req.body)

  try {
    await addParticipantsToConversation(conversation.sid, proxyAddresses)
    res.setHeader('content-type', 'application/json');
    return res.status(200).send(`${JSON.stringify(conversation)}`);
  } catch(err) {
    await deleteConversation(conversation.sid);
    return res.status(500).send(`${conversation.sid} failed to create session: ${err}`)
  }
};