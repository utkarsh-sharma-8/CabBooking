import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './HomeStyle';
import RecentTrips from '../common/RecentTrips';
import {greeting, firstName} from '../common/greeting';
import {getUser} from '../../utils/authStorage';
import {getTripHistory} from '../../utils/tripApi';
import {logout} from '../../utils/logout';

// Passenger landing screen, between Splash/login and the booking map
// (FirstScreen). Booking starts from here rather than being the first thing
// a signed-in passenger sees.
export default function Home() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setUser(await getUser());
    try {
      setHistory(await getTripHistory('passenger', 5));
    } catch (error) {
      console.log(`Home: could not load trip history: ${error}`);
      setHistory(previous => previous || {trips: [], summary: null});
    }
  }, []);

  // Refetch every time Home comes back into view — e.g. after a trip ends.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const bookRide = () => navigation.navigate('FirstScreen');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[styles.hero, {paddingTop: insets.top + 16}]}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName(user).charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={logout} accessibilityLabel="Log out">
              <Icon name="logout" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{firstName(user)}</Text>

          <TouchableOpacity style={styles.searchBar} onPress={bookRide} activeOpacity={0.85}>
            <Icon name="search" size={22} color="#1E1E1E" />
            <Text style={styles.searchText}>Where to?</Text>
            <View style={styles.nowChip}>
              <Icon name="schedule" size={14} color="#1E1E1E" />
              <Text style={styles.nowChipText}>Now</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsRow}>
            <ActionTile icon="local-taxi" label="Book a ride" onPress={bookRide} highlighted />
            <ActionTile
              icon="directions-car"
              label="Drive with RideNow"
              onPress={() => navigation.navigate('Verification')}
            />
          </View>
        </View>

        {history?.summary && (
          <View style={styles.section}>
            <View style={styles.statCard}>
              <Icon name="emoji-events" size={26} color="#B8860B" />
              <Text style={styles.statText}>
                {history.summary.totalCompleted === 0
                  ? 'Take your first ride with RideNow'
                  : `${history.summary.totalCompleted} ride${history.summary.totalCompleted === 1 ? '' : 's'} completed`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent rides</Text>
          {history ? (
            <RecentTrips trips={history.trips} emptyText="Your rides will show up here" />
          ) : (
            <ActivityIndicator style={styles.loader} color="#B8860B" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const ActionTile = ({icon, label, onPress, highlighted}) => (
  <TouchableOpacity
    style={[styles.actionTile, highlighted && styles.actionTileHighlighted]}
    onPress={onPress}
    activeOpacity={0.85}>
    <Icon name={icon} size={28} color="#1E1E1E" />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);
