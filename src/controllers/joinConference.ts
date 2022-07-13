import type { Request, Response } from "express";
import { JoinConferenceParams } from "../@types/session.types";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

function joinConferenceTwiml (conferenceName: string) : VoiceResponse {
  const response = new VoiceResponse()
  const dial = response.dial();
  dial.conference(`${decodeURIComponent(conferenceName)}`);

  return response
}

export const get = async (
  req: JoinConferenceParams,
  res: Response
) => {
  const conferenceName = req.query.conferenceName
  const twiml = await joinConferenceTwiml(conferenceName as string);

  res.set('Content-Type', 'text/xml')
  res.send(twiml.toString())
};