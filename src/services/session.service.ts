import { ActiveProxyAddresses, ProxyBindings } from "../@types/types";
import { listParticipantConversations, addParticipant } from "../utils";
import client from '../twilioClient'

export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  let activeConversations = {}

  const promises = phoneNumbers.map(async (phoneNumber: string) => {
    return activeConversations[phoneNumber] = await listParticipantConversations(phoneNumber)
  })

  return Promise.all(promises)
    .then(() => {
      return activeConversations;
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

  console.log(proxyBindings)

  return proxyBindings;
}

export const addParticipantsToConversation = async (conversationSid: string, proxyBindings: ProxyBindings) => {

  for (const [key, value] of Object.entries(proxyBindings)) {
    const participant = {
      'messagingBinding.address': key,
      'messagingBinding.proxyAddress': value
    } as any

    try {
      console.log('adding participant', participant)
      return addParticipant(conversationSid, participant) 
    } catch (err) {
      console.log(err)
      throw err
    }
  }
}