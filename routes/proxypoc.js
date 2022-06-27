var express = require('express');
const retry = require('async-await-retry');
const request = require('request');
var client = require("twilio")(process.env.TWIL_ACCOUNT_SID, process.env.TWIL_ACCOUNT_KEY);

const router = express.Router();
const numberPool = JSON.parse(process.env.NUMBER_POOL).sort();

async function timeout(data) {
  const interval = data.exponential ? data.interval * data.factor : data.interval;
  // if interval is set to zero, do not use setTimeout, gain 1 event loop tick
  if (interval) await new Promise(r => setTimeout(r, interval + data.jitter));
}

async function doCleanupConversation(conversationSid) {
  if ( !conversationSid) {
    console.error('Underfined conversationSid');
  }
  const conversationInst = client.conversations.conversations(conversationSid);
  const res = await retry( async () => {
    return conversationInst.remove();
    },
    null, 
    {
      onAttemptFail: async (data) => {
        if ( data.error.status === 429) {
          console.warn(`Got error response while cleaning up convo, will retry ${conversationSid}: ${JSON.stringify(data)}`);
          await timeout(data);
          return true;
        } else {
          console.error(`Got error response while cleaning up convo, not retrying ${conversationSid}: ${JSON.stringify(data)}`);
          return false; // dont retry
        }
      },
      retriesMax: 4,
      interval: 1000,
      exponential: true,
      factor: 3,
      jitter: 10000
    });
    return res;
}

async function cleanupConversation(conversationSid) {
  try { 
    await doCleanupConversation(conversationSid);
    console.log(`Removed new conversation successfully: ${conversationSid}`)
  } catch (removeError) {
    console.error(`Error occurred while removing ${conversationSid}: ${removeError}`);
  }
}

// Finds a single conversation for a participant with the given address and proxy address
async function getOpenConversationForAddressPair(address, proxyAddress) {
  if (address === undefined) {
    throw "getOpenConversationsForAddressPair: address is missing";
  }
  const params = {address: address, limit: 500};

  const participantConversations = await client.conversations.participantConversations.list(params);
  const conversation = participantConversations.find(p => {
    if (p.conversationState !== 'closed' && p.participantMessagingBinding.proxy_address === proxyAddress) {
      console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
      return p;
    }
  });

  return conversation;
}

// Finds all non-closed conversations in the list of conversations objects
async function getOpenConversationsForAddress(conversationsList) {

  const openConversationsProxyAddresses = new Set();

  conversationsList.forEach(p => {
    if (p.conversationState !== 'closed') {
      openConversationsProxyAddresses.add(p);
    }
  });

  return openConversationsProxyAddresses;
}

// Fetches the ParticipantConversations for the given address and returns all non closed conversations
async function fetchOpenConversationsForAddress(address) {
  if (address === undefined) {
    throw "fetchOpenConversationsForAddress: address is missing";
  }
  const params = {address: address, limit: 500};
  const participantConversations = await client.conversations.participantConversations.list(params);
  return getOpenConversationsForAddress(participantConversations);
}

// Helper method that fetches a Particpant's open Conversations and returns a Set of 
// the proxy_addresses in all those open conversations
async function fetchProxyAddressesInOpenConversationsForAddress(address) {
  if (address === undefined) {
    throw "fetchProxyAddressesInOpenConversationsForAddress: address is missing";
  }

  const proxyAddresses = new Set();

  const conversations = await fetchOpenConversationsForAddress(address);
  conversations.forEach(p => {
    console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
    proxyAddresses.add(p.participantMessagingBinding.proxy_address);
  });

  return proxyAddresses;
}

// Helper function for create /Conversations endpoint with retry handling
async function createConversation(sessionOpts) {
  const res = await retry( async () => {
    return client.conversations.conversations.create(sessionOpts);
    },
    null, 
    {
      onAttemptFail: async (data) => {
        console.warn(`Got error response when creating conversation ${JSON.stringify(data)}`);
        if ( data.error.status === 429) {
          await timeout(data);
          return true;
        } else {
          return false; // dont retry
        }
      },
      retriesMax: 4,
      interval: 1000,
      exponential: true,
      factor: 3,
      jitter: 1000
    });
    return res;
}

async function doAddParticipantToConversation(conversationSid, address, proxyAddress) {
  const res = await retry( async () => {
      return client.conversations.conversations(conversationSid).participants.create({
        'messagingBinding.address': address,
        'messagingBinding.proxyAddress': proxyAddress
      });
    },
    null, 
    {
      onAttemptFail: async (data) => {
        console.warn(`Got error response when adding participant ${address}:${proxyAddress} to ${conversationSid}: ${JSON.stringify(data)}`);
        if ( data.error.status === 429) {
          timeout(data);
          return true;
        } else {
          return false; // dont retry
        }
      },
      retriesMax: 4,
      interval: 1000,
      exponential: true,
      factor: 3,
      jitter: 1000
    });
    return res;
}

// Helper function for Conversations create /Participants endpoint
async function addParticipantToConversation(conversationSid, address, proxyAddress) {
  return doAddParticipantToConversation(conversationSid, address, proxyAddress);
}

// Get the numbers in the numberPool that are not in activeSessionNumbers
// This is accomplished by filtering out the activeSessionNumbers out of the number pool
function getSetOfAvailableNumbers(numberPool, activeSessionNumbers) {
  const notAvailableNumbers = new Set(activeSessionNumbers);

  const avalableNumbers = numberPool.filter((number) => {
    // return those elements not in the notAvailableNumbers
    return !notAvailableNumbers.has(number);
  });

  console.log(`Available numbers are: ${avalableNumbers}`)
  return avalableNumbers;
}

async function handleAddParticipant(conversationSid, address) {
  console.log(`handleAddParticipant called with ${conversationSid} and ${address}`);

  const openConversationsProxyAddresses = await fetchProxyAddressesInOpenConversationsForAddress(address);
  const availableNumbers = getSetOfAvailableNumbers(numberPool, openConversationsProxyAddresses);

  if ( availableNumbers.length === 0) {
    console.error(`No Proxy numbers to add ${address} to ${conversationSid}`);
    throw 'No proxy numbers available';
  } else {
    console.log(`Found proxy number candidates for ${address}: ${availableNumbers}`);
  }  

  // We need to iterate over the list of available numbers until we add the participant successfully
  // This is needed since we may issue more than one request for a given number to add to a session
  // for e.g. a driver has multiple deliveries to make
  let lastError;
  for ( let i = 0; i < availableNumbers.length; ++i) {
    try {
      console.log(`Try add ${address} with proxy_address ${availableNumbers[i]} to conversation ${conversationSid}`);
      const participant = await addParticipantToConversation(conversationSid, address, availableNumbers[i]);
      console.log(`Added participant ${address} successfully: ${participant.sid} to ${conversationSid}`);
      return participant;
    } catch (e) {
      console.error(`Failed to add participant ${address} with proxy_address ${availableNumbers[i]}: ${JSON.stringify(e)}`)
      lastError = e;
    }
  }

    // if we get here, it means we couldnt find a suitable number
    throw lastError;
}

/*
* Uses the from and the to call event attribtues to find a matching participant in a conversation and
* it will either connect the call to a participant or make an annoucement
*/
async function handleInboundCall(call) {

  // TODO check for required values

  const proxyAddress = call.To;
  const address = call.From;

  // let's see if this caller has a session (a conversation with the address/proxy address pair)
  const conversation = await getOpenConversationForAddressPair(address, proxyAddress);

  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();

  if ( !conversation) {
    console.log(`Didnt find matching session (conversation) for ${address}/${proxyAddress}`);
    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE
    }, process.env.OUT_OF_SESSION_MESSAGE_FOR_CALL);
  } else {

    // We got the conversation, let's get the participants in the convo.
    // We only support connecting one but this could be extended to create a conference
    const participants = await client.conversations.conversations(conversation.conversationSid).participants.list();
    const callee = participants.find( participant => {
      if ( participant.messagingBinding.address !== address) {
        return participant;
      }
    });

    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE
    }, process.env.CONNECTING_CALL_ANNOUCEMENT);

    // We call the second participant from the associated proxy_address
    const dial = response.dial({
      callerId: callee.messagingBinding.proxy_address
    });
    dial.number(callee.messagingBinding.address);
  }

  return response;
}

// Creates a conversation and adds the participants to the conversation
async function handleCreateSession(sessionOpts, addresses) {

  let newConversation;
  try {
    newConversation = await createConversation(sessionOpts);
    console.log(`Created new conversation successfully: ${newConversation.sid}`)
  } catch (e) {
    console.error(`Couldnt create a new session for ${JSON.stringify(addresses)}: ${JSON.stringify(e)}`)
    const error = {
      message: 'Could not create session',
      raw_message: JSON.stringify(e),
    }

    throw error;
  }

  try {
    const participants = [];
    for ( let i = 0; i < addresses.length; ++i) {
      participants[i] = await handleAddParticipant(newConversation.sid, addresses[i]);
    }

    const result = {
      sid: newConversation.sid,
      participants,
    }

    return result;

  } catch(e) {
    console.error(`Couldnt add participants to a new session for ${JSON.stringify(addresses)}: ${e}`)
    if ( newConversation) {
      try {
        await cleanupConversation(newConversation.sid);
      } catch (ce) {
        console.log(`Couldnt clean up conversation ${newConversation.sid}: ${JSON.stringify(ce)}`);
      }
    }
    const error = {
      sid: newConversation.sid,
      message: 'Could not add participants session',
      raw_message: JSON.stringify(e),
    }

    throw error;
  }
}


/*
* Calls handleInboundCall to handle inbound call event
*/
router.use('/inboundCall', async function(req, res, next) {
  const event = req.body;
  console.log("Got inbound call webhook event: ", event);
  
  try {
    const twiml = await handleInboundCall(event);
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString())  
  } catch(e) {
    console.error(`Something went wrong when handling inbound call ${e}`)
    res.send(500, e);
  }
});

// Returns the Conversations reverse chrono order
router.get('/sessions', async function(req, res, next) {
  const conversations =  await client.conversations.conversations.list({limit: req.query.limit?parseInt(req.query.limit):200});
  conversations.sort((a, b) => {
    if ( a.state === b.state) {
      return b.dateCreated - a.dateCreated;
    }
    return a.state==='closed'?1:-1;
  });

  res.render('conversations', { title: 'Conversations', conversations });
});

/*
* Returns a JSON doc of the participants in the conversation in which the given address and proxyAddress are a part of
* There should only be 1 conversation that matches.
*/
router.use('/participants', async function(req, res, next) {

  const address = req.query.address;
  const proxyAddress = req.query.proxyAddress;
  const conversation = await getOpenConversationForAddressPair( address, proxyAddress);
  if (conversation) {
    const participants = await client.conversations.conversations(conversation.conversationSid).participants.list();
    return res.status(200).send(`${JSON.stringify(participants)}`);
  }

  return res.send(404);
});

/*
 * Renders all (active, inactive, closed) Conversations which the given phoneNumber is participant
 * of in reverse chrono order (:phoneNumber(\\+[0-9]{11}))
*/
router.get('/participantsessions', async function(req, res, next) {
  if ( req.query.phoneNumber ) {

    const params = {address: req.query.phoneNumber, limit: 500};
    const conversations = await client.conversations.participantConversations.list(params);
    conversations.sort((a, b) => {
      if ( b.conversationState === 'active') {
        return 1;
      }
      return -1;
    });
    return res.render('participantConversations', { title: 'Conversations', conversations });
  }

  const conversations =  await client.conversations.conversations.list({limit: 100});
  conversations.sort((a, b) => {
    return b.dateCreated - a.dateCreated;
  });
  
  conversations.forEach( async c => {
    const ps = await c.participants().list();
    console.log(`${JSON.stringify(ps)}`)
  });

  res.render('conversations', { title: 'Conversations', conversations });
});

// Handle out of session messages
// Pre-requisite - This endpoint must be set as post event global webhook
router.use('/global-webhook', async function(req, res, next) {

  console.log(`Got conversation service webhook event query: ${JSON.stringify(req.body)}`);
  if  ( req.body.EventType !== 'onConversationAdded') {
    return res.send({});
  }

  if ( !req.body['ConversationSid']) {
    return res.send({});
  }

  // Send a friendly message
  const messageOpts = {
    author: 'System',
    body: process.eng.OUT_OF_SESSION_MESSAGE_ASYNC_CHANNEL,
  }

  await client.conversations.conversations(req.body.ConversationSid).messages.create(messageOpts);
  await cleanupConversation(req.body.ConversationSid.sid);

  res.send({});
});

/*
* Creates a session (conversation) for the given address(es)
* For each address submitted, it will find a proxy number and address/proxy number as a participant to the newly created conversation
* IF any oepration fails, it will delete the conversation
*/
router.post('/sessions', async function(req, res, next) {

  const addresses = Array.isArray(req.body.address)?req.body.address:[req.body.address];
  console.time('sessionCreate');

  // use default inactive timer value if none passed
  const inactiveTimer = req.body["timers.inactive"] ? req.body["timers.inactive"] : (process.env.CONVERSATION_SESSION_TIMEOUT_IN_MINUTES)?'PT'+eval(process.env.CONVERSATION_SESSION_TIMEOUT_IN_MINUTES)+'M':'PT0M';
  const closedTimer = req.body["timers.closed"] ? req.body["timers.closed"] : (process.env.CONVERSATION_SESSION_CLOSED_IN_MINUTES) ? 'PT'+eval(process.env.CONVERSATION_SESSION_CLOSED_IN_MINUTES)+'M':'PT0M';

  const sessionOpts = {
    attributes: req.body.attributes,
    friendlyName: req.body.friendlyName,
    messagingServiceSid: req.body.messagingServiceSid,
    timers: {
      inactive: inactiveTimer,
      closed: closedTimer,
    },
    uniqueName: req.body.uniqueName,
    xTwilioWebhookEnabled: req.body.xTwilioWebhookEnabled,
  };

  console.log(`Got session opts: ${JSON.stringify(sessionOpts)}`);

  try {
    const result = await handleCreateSession(sessionOpts, addresses);
    return res.status(200).send(`${JSON.stringify(result)}`);

  } catch(e) {
    console.error(`Couldnt create a new session for ${JSON.stringify(addresses)}: ${JSON.stringify(e)}`)
    return res.send(500, JSON.stringify(e));
  } finally {
    console.timeEnd('sessionCreate');
  }
});

module.exports = router;
