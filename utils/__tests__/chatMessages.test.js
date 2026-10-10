import {mergeHistory, setMessageStatus, upsertMessage} from '../chatMessages';

const server = (clientMsgId, senderRole, body) => ({
  id: `srv-${senderRole}-${clientMsgId}`,
  tripId: 't1',
  senderRole,
  clientMsgId,
  body,
});

describe('chatMessages', () => {
  test('the ack or echo of our own message replaces the optimistic copy instead of duplicating it', () => {
    const optimistic = [{senderRole: 'passenger', clientMsgId: 'a', body: 'hi', status: 'sending'}];
    const afterAck = upsertMessage(optimistic, server('a', 'passenger', 'hi'));
    const afterEcho = upsertMessage(afterAck, server('a', 'passenger', 'hi'));

    expect(afterEcho).toHaveLength(1);
    expect(afterEcho[0]).toMatchObject({id: 'srv-passenger-a', status: 'sent'});
  });

  test('the same clientMsgId from the other side is a different message', () => {
    const list = upsertMessage([], server('a', 'passenger', 'from passenger'));
    expect(upsertMessage(list, server('a', 'driver', 'from driver'))).toHaveLength(2);
  });

  test('history is authoritative but keeps local messages it does not contain yet', () => {
    const local = [
      {...server('a', 'passenger', 'stale copy'), status: 'sent'},
      {senderRole: 'passenger', clientMsgId: 'b', body: 'offline', status: 'failed'},
      {senderRole: 'passenger', clientMsgId: 'c', body: 'delivered after all', status: 'failed'},
    ];
    const history = [server('a', 'passenger', 'hello'), server('x', 'driver', 'coming'), server('c', 'passenger', 'delivered after all')];

    const merged = mergeHistory(local, history);
    expect(merged.map(m => [m.clientMsgId, m.status])).toEqual([
      ['a', 'sent'],
      ['x', 'sent'],
      ['c', 'sent'],
      ['b', 'failed'],
    ]);
  });

  test('a late failure never downgrades a message the server already confirmed', () => {
    const list = [{...server('a', 'passenger', 'hi'), status: 'sent'}];
    expect(setMessageStatus(list, 'passenger:a', 'failed')[0].status).toBe('sent');
  });
});
