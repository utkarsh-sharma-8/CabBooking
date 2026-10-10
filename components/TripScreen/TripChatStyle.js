import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 12,
  },
  close: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  list: {
    padding: 12,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#888888',
    marginTop: 32,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 3,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#2E7D32',
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  bodyMine: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  bodyTheirs: {
    color: '#1A1A1A',
    fontSize: 15,
  },
  meta: {
    fontSize: 11,
    color: '#888888',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  metaMine: {
    color: '#D7EED8',
  },
  metaFailed: {
    color: '#FFD2D2',
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  sendButton: {
    marginLeft: 8,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5C8A7',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default styles;
