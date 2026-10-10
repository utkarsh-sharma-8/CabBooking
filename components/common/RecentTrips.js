import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Straight-line distance — trips don't store a route, so this is the
// "as the crow flies" figure, labelled as approximate.
function distanceKm(a, b) {
  if (!a || !b) {return null;}
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {return '';}
  const day = date.toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
  const time = date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
  return `${day}, ${time}`;
}

const STATUS = {
  active: {label: 'In progress', color: '#B8860B', bg: '#FFF6D6'},
  completed: {label: 'Completed', color: '#2E7D32', bg: '#E8F5E9'},
  cancelled: {label: 'Cancelled', color: '#C62828', bg: '#FDECEA'},
};

export default function RecentTrips({trips, emptyText}) {
  if (!trips.length) {
    return (
      <View style={styles.empty}>
        <Icon name="history" size={28} color="#BBB" />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      {trips.map((trip, index) => {
        const status = STATUS[trip.status] || STATUS.completed;
        const km = distanceKm(trip.pickupLocation, trip.destinationLocation);
        return (
          <View key={trip.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.iconWrap}>
              <Icon name="local-taxi" size={20} color="#1E1E1E" />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{formatWhen(trip.createdAt)}</Text>
              <Text style={styles.subtitle}>
                {km === null ? 'Distance unavailable' : `≈ ${km.toFixed(1)} km`}
              </Text>
            </View>
            <View style={[styles.badge, {backgroundColor: status.bg}]}>
              <Text style={[styles.badgeText, {color: status.color}]}>{status.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  rowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5'},
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {flex: 1, marginLeft: 12},
  title: {fontSize: 15, fontWeight: '600', color: '#1E1E1E'},
  subtitle: {fontSize: 13, color: '#777', marginTop: 2},
  badge: {borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3},
  badgeText: {fontSize: 12, fontWeight: '600'},
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  emptyText: {color: '#888', marginTop: 8, fontSize: 14},
});
