import {StyleSheet} from 'react-native';

// Layout comes from HomeScreen/HomeStyle; these are the driver-only pieces.
const styles = StyleSheet.create({
  carChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -12,
    marginBottom: 20,
  },
  carChipText: {color: '#FFFFFF', marginLeft: 6, fontWeight: '600', letterSpacing: 1},
  statusCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18},
  statusRow: {flexDirection: 'row', alignItems: 'center'},
  offlineDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#9E9E9E', marginRight: 8},
  statusTitle: {fontSize: 18, fontWeight: 'bold', color: '#1E1E1E'},
  statusSubtitle: {color: '#666', marginTop: 6, fontSize: 14},
  goOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  goOnlineText: {marginLeft: 8, fontSize: 17, fontWeight: 'bold', color: '#1E1E1E'},
  statValue: {fontSize: 26, fontWeight: 'bold', color: '#1E1E1E', marginTop: 8},
  statLabel: {fontSize: 13, color: '#666', marginTop: 2},
});

export default styles;
