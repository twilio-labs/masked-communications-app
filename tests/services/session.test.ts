import {
  addParticipantsToConversation,
  getActiveProxyAddresses,
  matchAvailableProxyAddresses
} from '../../src/services/session.service'
import { listParticipantConversations } from '../../src/utils'
import { retryAddParticipant } from '../../src/utils/retryAddParticipant.util'

import { mockListParticipantsResponse } from '../support/testSupport'

jest.mock('../../src/utils/listParticipantConversations.util')
const mockedListParticipantConversations = jest.mocked(listParticipantConversations, true)

jest.mock('../../src/utils/retryAddParticipant.util')
const mockedRetryAddParticipant = jest.mocked(retryAddParticipant, true)

describe('session service', () => {
  describe('getActiveProxyAdresses', () => {
    it('receives a list of numbers and returns a keyed object with proxy address arrays', async () => {
      mockedListParticipantConversations.mockResolvedValue(mockListParticipantsResponse as any)
      const result = await getActiveProxyAddresses(['+1112223333', '+2223334444'])

      expect(result).toEqual({ '+1112223333': ['+3334445555', '+3334449999', '+4445556666'], '+2223334444': ['+3334445555', '+3334449999', '+4445556666'] })
    })

    it('returns key with empty array if no active conversations', async () => {
      mockedListParticipantConversations.mockResolvedValue([] as any)
      const result = await getActiveProxyAddresses(['+1112223333', '+2223334444'])

      expect(result).toEqual({ '+1112223333': [], '+2223334444': [] })
    })

    it('throws error if listParticipantConversations throws', async () => {
      const mockError = new Error()
      mockedListParticipantConversations.mockResolvedValue(mockError as any)

      await expect(getActiveProxyAddresses(['+1112223333', '+2223334444'])).rejects.toThrow()
    })
  })

  describe('matchAvailableProxyAddresses', () => {
    const env = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...env }
    })

    afterEach(() => {
      process.env = env
    })

    it('selects numbers that are not active proxy addresses', async () => {
      process.env.NUMBER_POOL = '["+3334445555", "+4445556666", "+5556667777", "+6667778888"]' as any

      const activeProxyAddresses = { '+1112223333': ['+3334445555', '+4445556666'], '+2223334444': ['+3334445555', '+4445556666'] }
      const result = await matchAvailableProxyAddresses(activeProxyAddresses)

      expect(result).toEqual({ '+1112223333': ['+5556667777', '+6667778888'], '+2223334444': ['+5556667777', '+6667778888'] })

      process.env = env
    })

    it('throws Not enough numbers error if <1 number in pool', async () => {
      process.env.NUMBER_POOL = '["+3334445555", "+4445556666"]' as any
      const activeProxyAddresses = { '+1112223333': ['+3334445555', '+4445556666'] }

      await expect(matchAvailableProxyAddresses(activeProxyAddresses)).rejects.toThrowError('Not enough numbers available in pool for +1112223333')
    })
  })

  describe('addParticipantsToConversation', () => {
    it('calls retryParticipantAdd with conversation sid and participant addresses', async () => {
      mockedRetryAddParticipant.mockResolvedValue({} as any)
      const proxyBindings = { '+1112223333': ['+5556667777', '+6667778888'], '+2223334444': ['+5556667777', '+6667778888'] }

      addParticipantsToConversation('CHXXXXX', proxyBindings)

      expect(mockedRetryAddParticipant).toBeCalledWith('CHXXXXX', '+1112223333', ['+5556667777', '+6667778888'])
      expect(mockedRetryAddParticipant).toBeCalledWith('CHXXXXX', '+2223334444', ['+5556667777', '+6667778888'])
      expect(mockedRetryAddParticipant).toBeCalledTimes(2)
    })

    it('throws error if retryAddParticipant throws', async () => {
      const mockError = new Error()
      mockedRetryAddParticipant.mockRejectedValue(mockError as any)
      const proxyBindings = { '+1112223333': ['+5556667777', '+6667778888'], '+2223334444': ['+5556667777', '+6667778888'] }

      await expect(addParticipantsToConversation('CHXXXXX', proxyBindings)).rejects.toThrow()
    })
  })
})
