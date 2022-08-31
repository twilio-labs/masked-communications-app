import request from 'supertest'
import * as InboundCallService from '../../src/services/inboundCall.service'
import { app } from '../../src/app/app'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

describe('inbound call controller', () => {
  jest.setTimeout(3600000)

  // Test parameters
  const fromNumber = '+1001'
  const toNumber = '+1002'
  const twimlResponse = new VoiceResponse()
  const dial = twimlResponse.dial();
  dial.conference('Room1234');

  it('should generate twiml', async () => {
    const generateTwimlSpy = jest
      .spyOn(InboundCallService, 'generateTwiml')
      .mockResolvedValue(twimlResponse)

    const res = await request(app)
      .post('/inbound-call')
      .set('content-type', 'application/json')
      // .set('Authorization', process.env.AUTH_HEADER)
      .send({
        From: fromNumber,
        Called: toNumber
      })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference>Room1234</Conference></Dial></Response>')
    expect(generateTwimlSpy).toBeCalledWith(fromNumber, toNumber)
  })
})
