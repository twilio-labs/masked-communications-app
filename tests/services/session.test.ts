import { getActiveProxyAddresses } from "../../src/services/session.service"
import { listParticipantConversations } from "../../src/utils"
import { mockListParticipantsResponse } from "../support/testSupport"

jest.mock('../../src/utils/listParticipantConversations.util')
const mockedListParticipantConversations = jest.mocked(listParticipantConversations, true)


describe('session service', () => {
  describe('getActiveProxyAdresses', () => {

    it('receives a list of numbers and returns a keyed object with proxy address arrays', async () => {
      mockedListParticipantConversations.mockResolvedValue(mockListParticipantsResponse as any)
      const result = await getActiveProxyAddresses(['+1112223333', '+2223334444'])

      expect(result).toEqual({"+1112223333": ["+3334445555", "+4445556666"], "+2223334444": ["+3334445555", "+4445556666"]})
    })

    it('returns key with empty array if no active conversations', async () => {
      mockedListParticipantConversations.mockResolvedValue([] as any)
      const result = await getActiveProxyAddresses(['+1112223333', '+2223334444'])

      expect(result).toEqual({"+1112223333": [], "+2223334444": []})
    })
  })

  describe('matchAvailableProxyAddresses', () => {

  })

  describe('retryParticipantAdd', () => {

  })

  describe('addParticipantsToConversation', () => {

  })
})