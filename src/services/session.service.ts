import { ActiveProxyAddresses, ProxyBindings } from '../@types/types'
import { listParticipantConversations, retryAddParticipant } from '../utils'

export const getActiveProxyAddresses = async (phoneNumbers: Array<String>) : Promise<ActiveProxyAddresses> => {
  const activeConversations = {}

  const promises = phoneNumbers.map(async (phoneNumber: string) => {
    // listParticipantConversations returns ALL conversations, closed and active.
    const participantConversations = await listParticipantConversations(phoneNumber)

    // We want to ignore closed conversations since we cant use conversations once they're closed.
    // We can use conversations that are active or inactive
    const participantActiveConversations = participantConversations.filter((participant) => {
      return participant.conversationState !== 'closed'
    })
    // Let's get all the proxy addresses that currently being used in the active conversations
    const proxyAddresses = participantActiveConversations.map((participant) => {
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
    const phoneNumbers: Array<String> = JSON.parse(process.env.NUMBER_POOL).sort()

    const proxyBindings = {}

    for (const [key, activeAddresses] of Object.entries(activeProxyAddresses)) {
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
