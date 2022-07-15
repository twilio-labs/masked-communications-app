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
        throw new Error(`Not enough numbers available in pool for ${key}`)
      }
      
      proxyBindings[key] = availableNumbers;
    }
  
    return proxyBindings;
  } catch(err) {
    console.log(err)
    throw new Error(err)
  }
}

const retryParticipantAdd = async (conversationSid: string, participantAddress: string, proxyAddresses: Array<string>) => {
  try {
    while(proxyAddresses.length > 0) {
      try {
        const participant = {
          'messagingBinding.address': participantAddress,
          'messagingBinding.proxyAddress': proxyAddresses[0]
        } as any
  
        return addParticipant(conversationSid, participant)
  
      } catch(err) {
        if (err.code === 50416) {
          const remainingProxyAddresses = proxyAddresses.shift()
          retryParticipantAdd(conversationSid, participantAddress, remainingProxyAddresses as any)
        }
        console.log(err)
        throw new Error(err)
      }
    }

    throw new Error(`No proxy addresses available for ${participantAddress}`)
  } catch(err) {
    console.log(err)
    throw new Error(err)
  }
}

export const addParticipantsToConversation = async (conversationSid: string, proxyBindings: ProxyBindings) => {
  const promises = []

  for (const [participantAddress, proxyAddresses] of Object.entries(proxyBindings)) {

    try {
      const participantAttempt = retryParticipantAdd(conversationSid, participantAddress, proxyAddresses)
      promises.push(participantAttempt)
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