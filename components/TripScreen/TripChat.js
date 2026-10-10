import React, {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {messageKey} from '../../utils/chatMessages';
import styles from './TripChatStyle';

const MAX_LENGTH = 500; // matches MAX_CHAT_MESSAGE_LENGTH on the server

const formatTime = iso => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

function MessageBubble({message, mine, onRetry}) {
  const failed = message.status === 'failed';
  let meta = formatTime(message.createdAt);
  if (message.status === 'sending') meta = 'Sending…';
  if (failed) meta = 'Not sent · tap to retry';

  return (
    <TouchableOpacity
      activeOpacity={failed ? 0.6 : 1}
      disabled={!failed}
      onPress={() => onRetry(message)}
      style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={mine ? styles.bodyMine : styles.bodyTheirs}>{message.body}</Text>
      <Text style={[styles.meta, mine && styles.metaMine, failed && styles.metaFailed]}>{meta}</Text>
    </TouchableOpacity>
  );
}

// Full-screen chat over the trip map. State comes from useTripChat in
// TripScreen, so closing this doesn't drop messages.
export default function TripChat({visible, onClose, chat, myRole, otherPartyName}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (visible && chat.messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
    }
  }, [visible, chat.messages.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    chat.send(draft);
    setDraft('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {otherPartyName || (myRole === 'driver' ? 'Passenger' : 'Driver')}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={messageKey}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <MessageBubble message={item} mine={item.senderRole === myRole} onRetry={chat.retry} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Messages are only available during this trip.
            </Text>
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor="#999999"
            maxLength={MAX_LENGTH}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!draft.trim()}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
