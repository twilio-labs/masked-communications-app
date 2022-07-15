import { ActiveProxyAddresses, ProxyBindings } from "../@types/types";
import { listParticipantConversations, addParticipant } from "../utils";

export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  let activeConversations = {}

  const promises = phoneNumbers.map(async (phoneNumber: string) => {
    const participantConversations = await listParticipantConversations(phoneNumber)

    const proxyAddresses = participantConversations.map((participant) => {
      return participant.participantMessagingBinding.proxy_address
    })

    return activeConversations[phoneNumber] = proxyAddresses
  })

  try {
    await Promise.all(promises)
    return activeConversations;
  } catch(err) {
    console.log(err)
    throw new Error(err)    
  }
}

export const matchAvailableProxyAddresses = async (activeProxyAddresses: ActiveProxyAddresses) : Promise<ProxyBindings> => {
  try {
    const phoneNumbers: Array<String> = JSON.parse(process.env.NUMBER_POOL).sort()
    
    let proxyBindings = {};
  
    for (const [key, activeAddresses] of Object.entries(activeProxyAddresses)) {
  
      const availableNumbers = phoneNumbers.filter((pn) => {     
        return !activeAddresses.includes(pn);
      })
  
      if (availableNumbers.length < 1) {
        throw new Error('Not enough numbers available in pool.')
      }
      
      proxyBindings[key] = availableNumbers[0];
    }
  
    return proxyBindings;
  } catch(err) {
    console.log(err)
    throw new Error(err)
  }
}

export const addParticipantsToConversation = async (conversationSid: string, proxyBindings: ProxyBindings) => {
  const promises = []

  for (const [key, value] of Object.entries(proxyBindings)) {
    const participant = {
      'messagingBinding.address': key,
      'messagingBinding.proxyAddress': value
    } as any

    try {
      const participantRequest = addParticipant(conversationSid, participant)
      promises.push(participantRequest)
    } catch (err) {
      console.log(err)
      throw new Error(err)
    }
  }

  try {
    const results = await Promise.all(promises)
    return results
  } catch(err) {
    console.log(err)
    throw new Error(err)
  }
}