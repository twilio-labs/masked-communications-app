import { addParticipant } from '../../src/utils/addParticipant.util'
import { mockParticpantInstance } from '../support/testSupport'
import * as retry from '../../src/utils/retryAddParticipant.util'

jest.mock('../../src/utils/addParticipant.util')


describe('retryParticipantAdd', () => {
  it('throws if no proxy addresses are left', async () => {
    await expect(retry.retryAddParticipant('CH1234', '+111', []))
      .rejects
      .toThrowError('No available proxy addresses for +111')
  })

  it('calls itself again when 50416 is thrown to try another address', async () => {
    const mockAddParticipant = jest.mocked(addParticipant, true)

    interface TwilioError extends Error {
      code: number
    }

    class TwilioError extends Error {
      constructor(message) {
        super(message);
        this.name = "ConcurrencyLimit";
        this.code = 50416
      }
    }

    const retrySpy = jest.spyOn(retry, 'retryAddParticipant')

    const rejectedValue = new TwilioError('Number already in use')

    mockAddParticipant
      .mockRejectedValueOnce(rejectedValue)
      .mockResolvedValueOnce(mockParticpantInstance as any)

    const result = await retry.retryAddParticipant('CH1234', '+111', ['+222', '+333'])
    expect(retrySpy).toBeCalledTimes(1)
    expect(mockAddParticipant).nthCalledWith(1, 'CH1234', {
      'messagingBinding.address': '+111',
      'messagingBinding.proxyAddress': '+222'
    })
    expect(mockAddParticipant).nthCalledWith(2, 'CH1234', {
      'messagingBinding.address': '+111',
      'messagingBinding.proxyAddress': '+333'
    })
    expect(mockAddParticipant).toBeCalledTimes(2)
    expect(result).toEqual(mockParticpantInstance)
  })

  it('throws an error if client err code is not 50416', async () => {
    const mockAddParticipant = jest.mocked(addParticipant, true)

    const rejectedValue = new Error('Twilio Problem')
    mockAddParticipant
      .mockRejectedValue(rejectedValue)

    debugger
    await expect(retry.retryAddParticipant('CH1234', '+111', ['+222', '+333']))
      .rejects
      .toThrow('Twilio Problem')
  })
})