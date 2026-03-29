import { z } from 'zod'

// Phone number regex for E.164 format
const phoneRegex = /^\+?[1-9]\d{1,14}$/

// Inbound call validation
export const InboundCallSchema = z.object({
  From: z.string().regex(phoneRegex, 'Invalid From phone number'),
  Called: z.string().regex(phoneRegex, 'Invalid Called phone number'),
  CallSid: z.string().optional(),
  AccountSid: z.string().optional()
})

export type InboundCallRequest = z.infer<typeof InboundCallSchema>

// Conversation event validation
export const ConversationEventSchema = z.object({
  EventType: z.string(),
  State: z.string().optional(),
  ConversationSid: z.string(),
  AccountSid: z.string().optional(),
  ChatServiceSid: z.string().optional(),
  MessagingServiceSid: z.string().optional(),
  DateCreated: z.string().optional(),
  DateUpdated: z.string().optional(),
  Attributes: z.string().optional(),
  Source: z.string().optional(),
  RetryCount: z.string().optional()
})

export type ConversationEventRequest = z.infer<typeof ConversationEventSchema>

// Session creation validation
export const SessionPostBodySchema = z.object({
  addresses: z.array(z.string().regex(phoneRegex, 'Invalid phone number')),
  recordingEnabled: z.boolean().optional().default(false),
  transcriptionEnabled: z.boolean().optional().default(false),
  friendlyName: z.string().optional(),
  uniqueName: z.string().optional(),
  attributes: z.string().optional()
})

export type SessionPostBodyRequest = z.infer<typeof SessionPostBodySchema>

// Recording status callback validation
export const RecordingStatusCallbackSchema = z.object({
  RecordingSid: z.string(),
  RecordingUrl: z.string().url(),
  RecordingStatus: z.enum(['in-progress', 'completed']),
  RecordingChannels: z.string().optional(),
  RecordingDuration: z.string().optional(),
  ConversationSid: z.string().optional(),
  AccountSid: z.string().optional()
})

export type RecordingStatusCallbackRequest = z.infer<typeof RecordingStatusCallbackSchema>

// Transcription status callback validation
export const TranscriptionStatusCallbackSchema = z.object({
  TranscriptionSid: z.string(),
  TranscriptionText: z.string().optional(),
  TranscriptionStatus: z.enum(['completed', 'failed']),
  RecordingSid: z.string(),
  ConversationSid: z.string().optional(),
  AccountSid: z.string().optional(),
  Confidence: z.string().optional()
})

export type TranscriptionStatusCallbackRequest = z.infer<typeof TranscriptionStatusCallbackSchema>
