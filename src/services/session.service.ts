import client from "../twilioClient";
import { ActiveProxyAddresses, ProxyBindings } from "../@types/session.types";

export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
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

export const matchAvailableProxyAddresses = async (activeProxyAddresses: ActiveProxyAddresses) : Promise<ProxyBindings> => {
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

export const addParticipantsToConversation = (conversationSid: string, proxyBindings: ProxyBindings) => {
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