// Pure list operations behind useTripChat. A message on screen is either
// confirmed by the server (status 'sent') or one of ours still in flight
// ('sending') or rejected/timed out ('failed', tap to retry).
//
// Identity is senderRole + clientMsgId, not the server id: our own optimistic
// message has no server id yet, and when its ack or its chat_message echo
// arrives it has to replace the optimistic copy, not appear twice.

export const messageKey = message => `${message.senderRole}:${message.clientMsgId}`;

export const newClientMsgId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Inserts or replaces a server-confirmed message.
export const upsertMessage = (messages, serverMessage) => {
  const key = messageKey(serverMessage);
  const confirmed = {...serverMessage, status: 'sent'};
  const index = messages.findIndex(m => messageKey(m) === key);
  if (index === -1) return [...messages, confirmed];
  const next = [...messages];
  next[index] = confirmed;
  return next;
};

// Server history is authoritative for everything it contains; local messages
// it doesn't contain yet (still sending, or failed) stay at the end.
export const mergeHistory = (messages, history) => {
  const confirmed = history.map(m => ({...m, status: 'sent'}));
  const known = new Set(confirmed.map(messageKey));
  const pending = messages.filter(m => m.status !== 'sent' && !known.has(messageKey(m)));
  return [...confirmed, ...pending];
};

export const setMessageStatus = (messages, key, status) =>
  messages.map(m => (messageKey(m) === key && m.status !== 'sent' ? {...m, status} : m));
