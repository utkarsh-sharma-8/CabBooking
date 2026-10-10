import {useCallback, useEffect, useRef, useState} from 'react';
import {
  fetchChatHistory,
  onChatMessage,
  onSocketConnect,
  sendChatMessage,
} from '../../utils/socket';
import {
  messageKey,
  mergeHistory,
  newClientMsgId,
  setMessageStatus,
  upsertMessage,
} from '../../utils/chatMessages';

// Chat state for the trip on screen. Lives in TripScreen (not the chat
// modal) so messages keep arriving — and count as unread — while the modal
// is closed. myRole is 'driver' or 'passenger'.
export default function useTripChat(tripId, myRole) {
  const [messages, setMessages] = useState([]);
  const [seenCount, setSeenCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const tripIdRef = useRef(tripId);
  tripIdRef.current = tripId;

  const loadHistory = useCallback(async () => {
    try {
      const result = await fetchChatHistory();
      if (result?.ok && result.tripId === tripIdRef.current) {
        setMessages(prev => mergeHistory(prev, result.messages));
      }
    } catch {
      // Offline or timed out — the next reconnect triggers another load.
    }
  }, []);

  useEffect(() => {
    if (!tripId) return undefined;
    setMessages([]);
    setSeenCount(0);
    loadHistory();
    const offMessage = onChatMessage(message => {
      if (message?.tripId === tripIdRef.current) {
        setMessages(prev => upsertMessage(prev, message));
      }
    });
    const offConnect = onSocketConnect(loadHistory);
    return () => {
      offMessage();
      offConnect();
    };
  }, [tripId, loadHistory]);

  const deliver = useCallback(async message => {
    const key = messageKey(message);
    setMessages(prev => setMessageStatus(prev, key, 'sending'));
    try {
      const result = await sendChatMessage(message);
      if (result?.ok) {
        setMessages(prev => upsertMessage(prev, result.message));
        return;
      }
    } catch {
      // Timed out — fall through to failed; a retry reuses the clientMsgId,
      // so it can't duplicate a message that did reach the server.
    }
    setMessages(prev => setMessageStatus(prev, key, 'failed'));
  }, []);

  const send = useCallback(
    text => {
      const body = text.trim();
      if (!body || !tripIdRef.current || !myRole) return;
      const message = {
        tripId: tripIdRef.current,
        senderRole: myRole,
        body,
        clientMsgId: newClientMsgId(),
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      setMessages(prev => [...prev, message]);
      deliver(message);
    },
    [myRole, deliver],
  );

  const retry = useCallback(message => deliver(message), [deliver]);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const incoming = messages.filter(m => m.senderRole !== myRole).length;
  // While open, everything is read as it arrives.
  useEffect(() => {
    if (isOpen) setSeenCount(incoming);
  }, [isOpen, incoming]);

  return {
    messages,
    send,
    retry,
    unreadCount: Math.max(0, incoming - seenCount),
    isOpen,
    open,
    close,
  };
}
