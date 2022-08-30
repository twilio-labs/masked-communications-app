import { ActiveProxyAddresses, ProxyBindings } from '../@types/types'
import { listParticipantConversations, retryAddParticipant } from '../utils'
import { geoRouter } from './geoRouter.service'
import { phoneBatchSize } from '../config/phoneBatchSize'

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

export function pullNumbers (userPhone: string, activeAddresses: String[], from: number) {
  const phoneNumbers: Array<String> = geoRouter(userPhone, from, phoneBatchSize)
  console.log({ userPhone }, { activeAddresses }, { phoneNumbers }, { from })
  if (phoneNumbers.length === 0) {
    throw new Error(`Not enough numbers available in pool for ${userPhone}`)
  }

  const availableNumbers = phoneNumbers.filter((pn) => {
    return !activeAddresses.includes(pn)
  })

  console.log({ availableNumbers })

  if (availableNumbers.length < 1) {
    return pullNumbers(userPhone, activeAddresses, from + phoneBatchSize)
  }

  return { [userPhone]: availableNumbers }
}

export const matchAvailableProxyAddresses = async (activeProxyAddresses: ActiveProxyAddresses) : Promise<ProxyBindings> => {
  try {
    let proxyBindings = {}

    for (const [userPhone, activeAddresses] of Object.entries(activeProxyAddresses)) {
      const newBindings = pullNumbers(userPhone, activeAddresses, 0)
      proxyBindings = Object.assign(proxyBindings, newBindings)
    }

    return proxyBindings
  } catch (err) {
    console.log(err)
    throw Error(err)
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
