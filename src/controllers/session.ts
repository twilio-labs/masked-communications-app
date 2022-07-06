import type { Request, Response } from "express";
import { ParticipantInstance } from "twilio/lib/rest/conversations/v1/conversation/participant";
import Proxy from "twilio/lib/rest/Proxy";
import { addParticipantToConversation } from "../services/participant.service";
import client from "../twilioClient";

export const _delete = async (
  req: Request<{}, {}, SessionDeleteBody>,
  res: Response
) => {};

interface SessionDeleteBody {}

const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  let activeConversations = {}

  const promises = phoneNumbers.map(async (pn: string) => {
    await client.conversations.participantConversations
      .list({address: pn})
      .then((participantConversations) => {
        let activeProxyAddresses = participantConversations.map((pc) => {
          return pc.participantMessagingBinding.proxy_address;
        })

        activeConversations[pn] = activeProxyAddresses;
        return;
      })
  })

  return Promise.all(promises)
    .then(() => {
      return activeConversations;
    })
    .catch((err) => {
      throw `getActiveProxyAddresses: ${err}`
    })
}

const matchAvailableProxyAddresses = async (activeProxyAddresses: ActiveProxyAddresses) : Promise<ProxyBindings> => {
  const phoneNumbers: Array<String> = JSON.parse(process.env.NUMBER_POOL).sort()

  let proxyBindings = {};

  for (const [key, value] of Object.entries(activeProxyAddresses)) {
    const availableNumbers = phoneNumbers.filter((pn) => {
      return pn !== String(value);
    })

    proxyBindings[key] = availableNumbers[0];
  }

  return proxyBindings;
}

const createConversation = async () : Promise<string> => {
  return await client.conversations.conversations
    .create({friendlyName: `conversation_at_${Date.now()}`})
    .then((c) => { return c.sid })
    .catch((err) => { throw `createConversation: ${err}` });
}

const addParticipantsToConversation = (conversationSid: string, proxyBindings: ProxyBindings) => {
  let promises = [];

  for (const [key, value] of Object.entries(proxyBindings)) {
    const participant = {
      'messagingBinding.address': key,
      'messagingBinding.proxyAddress': value
    } as any

    const request = client.conversations
      .conversations(conversationSid)
      .participants
      .create(participant)
      .then((p) => {
        console.log(p.sid);
        return p.sid;
      })
      .catch((err) => { throw `addParticipantsToConversation: ${err}`})
    
    promises.push(request);
  }

  return Promise.all(promises);
}

export const post = async (
  req: Request<{}, {}, SessionPostBody>,
  res: Response
) => {
  console.log(req.body);

  const phoneNumbers = req.body.participantAddresses;
  const activeProxyAddresses = await getActiveProxyAddresses(phoneNumbers); 
  const proxyBindings = await matchAvailableProxyAddresses(activeProxyAddresses);
  const conversationSid = await createConversation()
  await addParticipantsToConversation(conversationSid, proxyBindings)

  res.sendStatus(200)
};

interface SessionPostBody {
  participantAddresses: Array<string>;
}

interface ActiveProxyAddresses {
  [key: string]: Array<string>
}

interface ProxyBindings {
  [key: string]: string
}