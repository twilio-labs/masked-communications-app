import { ActiveProxyAddresses, ProxyBindings } from '../@types/types'
import { listParticipantConversations, retryAddParticipant } from '../utils'
import { geoRouter } from './geoRouter.service'

export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  const activeConversations = {}

  const promises = phoneNumbers.map(async (phoneNumber: string) => {
    const participantConversations = await listParticipantConversations(phoneNumber)

    const proxyAddresses = participantConversations.map((participant) => {
      return participant.participantMessagingBinding.proxy_address
    })

    activeConversations[phoneNumber] = proxyAddresses
    return activeConversations
  })

  try {
    await Promise.all(promises)
    return activeConversations
  } catch (err) {
    console.log(err)
    throw new Error(err)
  }
}

export const matchAvailableProxyAddresses = async (activeProxyAddresses: ActiveProxyAddresses) : Promise<ProxyBindings> => {
  try {
    const proxyBindings = {}

    for (const [key, activeAddresses] of Object.entries(activeProxyAddresses)) {
      console.log(key);

      const phoneNumbers: Array<String> = geoRouter(key)
      const availableNumbers = phoneNumbers.filter((pn) => {
        return !activeAddresses.includes(pn)
      })

      if (availableNumbers.length < 1) {
        throw new Error(`Not enough numbers available in pool for ${key}`)
      }

      proxyBindings[key] = availableNumbers
    }

    return proxyBindings
  } catch (err) {
    console.log(err)
    throw new Error(err)
  }
}

export const addParticipantsToConversation = async (conversationSid: string, proxyBindings: ProxyBindings) => {
  const promises = []

  for (const [participantAddress, proxyAddresses] of Object.entries(proxyBindings)) {
    const participantAttempt = retryAddParticipant(conversationSid, participantAddress, proxyAddresses)
    promises.push(participantAttempt)
  }

  try {
    const results = await Promise.all(promises)
    return results
  } catch (err) {
    console.log(err)
    throw new Error(err)
  }
}
