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
import homeStyles from '../../HomeScreen/HomeStyle';
import styles from './DriverHomeStyle';
import RecentTrips from '../../common/RecentTrips';
import {greeting, firstName} from '../../common/greeting';
import {getUser} from '../../../utils/authStorage';
import {getTripHistory} from '../../../utils/tripApi';
import {logout} from '../../../utils/logout';

// Driver landing screen. The driver is OFFLINE here — not in ride matching —
// and goes online by opening the map (DriverScreen, which registers with the
// server). Leaving the map takes them offline again (see DriverScreen's
// beforeRemove handler), so "on this screen" always means "not receiving
// requests".
export default function DriverHome() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setUser(await getUser());
    try {
      setHistory(await getTripHistory('driver', 5));
    } catch (error) {
      console.log(`DriverHome: could not load trip history: ${error}`);
      setHistory(previous => previous || {trips: [], summary: null});
    }
  }, []);

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

  const summary = history?.summary;

  return (
    <View style={homeStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[homeStyles.hero, {paddingTop: insets.top + 16}]}>
          <View style={homeStyles.heroTop}>
            <View style={homeStyles.avatar}>
              <Text style={homeStyles.avatarText}>{firstName(user).charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={homeStyles.iconButton} onPress={logout} accessibilityLabel="Log out">
              <Icon name="logout" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={homeStyles.greeting}>{greeting()},</Text>
          <Text style={homeStyles.name}>{firstName(user)}</Text>
          {user?.carNo ? (
            <View style={styles.carChip}>
              <Icon name="directions-car" size={16} color="#FFD700" />
              <Text style={styles.carChipText}>{user.carNo}</Text>
            </View>
          ) : null}

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.offlineDot} />
              <Text style={styles.statusTitle}>You're offline</Text>
            </View>
            <Text style={styles.statusSubtitle}>Go online to start receiving ride requests nearby.</Text>
            <TouchableOpacity
              style={styles.goOnlineButton}
              onPress={() => navigation.navigate('DriverScreen')}
              activeOpacity={0.85}>
              <Icon name="power-settings-new" size={22} color="#1E1E1E" />
              <Text style={styles.goOnlineText}>Go online</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={homeStyles.section}>
          <Text style={homeStyles.sectionTitle}>Your stats</Text>
          <View style={homeStyles.actionsRow}>
            <StatTile icon="today" label="Trips today" value={summary?.completedToday} />
            <StatTile icon="emoji-events" label="Total trips" value={summary?.totalCompleted} />
          </View>
        </View>

        <View style={homeStyles.section}>
          <Text style={homeStyles.sectionTitle}>Recent trips</Text>
          {history ? (
            <RecentTrips trips={history.trips} emptyText="Trips you drive will show up here" />
          ) : (
            <ActivityIndicator style={homeStyles.loader} color="#B8860B" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const StatTile = ({icon, label, value}) => (
  <View style={homeStyles.actionTile}>
    <Icon name={icon} size={24} color="#B8860B" />
    <Text style={styles.statValue}>{value ?? '–'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);
