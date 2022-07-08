import client from "../twilioClient";
import { ActiveProxyAddresses, ProxyBindings } from "../@types/session.types";
import { addParticipant } from "../utils/addParticipant.util";
import { listParticipantConversations } from "../utils/listParticipantConversations.util";
export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  let activeConversations = {}

  phoneNumbers.map(async (phoneNumber: string) => {
    activeConversations[phoneNumber] = await listParticipantConversations(phoneNumber);
  })

  return activeConversations;
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

export const addParticipantsToConversation = async (conversationSid: string, proxyBindings: ProxyBindings) => {
  for (const [key, value] of Object.entries(proxyBindings)) {
    const participant = {
      'messagingBinding.address': key,
      'messagingBinding.proxyAddress': value
    } as any

    await addParticipant(conversationSid, participant)    
  }
}