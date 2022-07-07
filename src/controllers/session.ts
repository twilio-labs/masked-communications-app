import type { Request, Response } from "express";
import { ConversationInstance, ConversationListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation";
import client from "../twilioClient";

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

const createConversation = async (options: SessionPostBody) : Promise<ConversationInstance> => {
  return await client.conversations.conversations
    .create(options)
    .then((c) => { return c })
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

  return Promise.all(promises)
    .catch((err) => { throw `addParticipantsToConversation: ${err}`});
}

const deleteConversation = async (conversationSid: string) : Promise<boolean> => {
  return client.conversations
    .conversations(conversationSid)
    .remove()
    .then((c) => { return c })
    .catch((err) => { throw err })
}

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

// Typescript Interfaces
interface SessionPostBody extends ConversationListInstanceCreateOptions {
  addresses: Array<string> 
}

interface SessionDeleteBody {
  MessagingServiceSid: string
  RetryCount: string
  EventType: string
  DateUpdated: string
  State: string
  Attributes: string
  DateCreated: string
  ChatServiceSid: string
  AccountSid: string
  Source: string
  ConversationSid: string
}

interface ActiveProxyAddresses {
  [key: string]: Array<string>
}

interface ProxyBindings {
  [key: string]: string
}