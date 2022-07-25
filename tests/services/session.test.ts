import { ParticipantInstance } from "twilio/lib/rest/api/v2010/account/conference/participant"
import {
  addParticipantsToConversation,
  getActiveProxyAddresses,
  matchAvailableProxyAddresses } from "../../src/services/session.service"
import { listParticipantConversations } from "../../src/utils"
import * as retryModule from '../../src/utils/retryAddParticipant.util'

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
    it('selects numbers that are not active proxy addresses', async () => {
      const env = process.env
      jest.resetModules()

      process.env.NUMBER_POOL = '["+3334445555", "+4445556666", "+5556667777", "+6667778888"]' as any
      
      const activeProxyAddresses = {"+1112223333": ["+3334445555", "+4445556666"], "+2223334444": ["+3334445555", "+4445556666"]}
      const result = await matchAvailableProxyAddresses(activeProxyAddresses)
  
      expect(result).toEqual({"+1112223333": ["+5556667777", "+6667778888"], "+2223334444": ["+5556667777", "+6667778888"]})

      process.env = env
    })
  })

  // describe('retryParticipantAdd', () => {

  //   retryParticipantAdd('CHXXXXX', '+1112223333', ["+5556667777", "+6667778888"])


  // })

  describe('addParticipantsToConversation', () => {
    const mockedRetryParticipantAdd = jest.spyOn(retryModule, 'retryAddParticipant')
    const proxyBindings = {"+1112223333": ["+5556667777", "+6667778888"], "+2223334444": ["+5556667777", "+6667778888"]}

    it('calls retryParticipantAdd with conversation sid and participant addresses', async () => {
      addParticipantsToConversation('CHXXXXX', proxyBindings)

      expect(mockedRetryParticipantAdd).toBeCalledTimes(2)
    })
  })
})