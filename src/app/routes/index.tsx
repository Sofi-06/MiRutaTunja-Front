import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { getFavorites, toggleFavorite } from '@/services/localData';

const routeItems = Object.entries(routesMetadata).map(([key, route]) => ({ ...route, key, code: `R-${key.replace('R', '').padStart(2, '0')}` }));

export default function RoutesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isNative = Platform.OS !== 'web';
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  useEffect(() => {
    void getFavorites().then((favorites) => {
      setFavoriteIds(favorites.map((favorite) => favorite.id));
      setIsLoading(false);
    });
  }, []);
  const filteredRoutes = routeItems.filter((route) => `${route.code} ${route.name} ${route.category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <View style={styles.heroBlock}>
          {!isCompact && <Image source={require('@/assets/images/hoja2.png')} resizeMode="contain" style={styles.heroLeafLeft} />}
          {!isCompact && <Image source={require('@/assets/images/hoja3.png')} resizeMode="contain" style={styles.heroLeafRight} />}
          <Text style={styles.eyebrow}>MOVILIDAD URBANA</Text>
          <Text style={[styles.title, isNative && styles.titleNative]}>Rutas <Text style={styles.titleAccent}>disponibles</Text></Text>
          <Text style={[styles.subtitle, isNative && styles.subtitleNative]}>Consulta recorridos, horarios y frecuencia de las rutas urbanas de Tunja.</Text>
          <View style={[styles.searchBox, isNative && styles.searchBoxNative]}>
            <Icon name="search" color="#527267" size={22} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por ruta, barrio o destino..." placeholderTextColor="#789087" style={styles.searchInput} />
          </View>
          <View style={styles.filters}>
            {['Todas', 'Terminal', 'Universidad', 'Norte'].map((filter) => (
              <Pressable key={filter} onPress={() => setQuery(filter === 'Todas' ? '' : filter)} style={[styles.filterPill, (filter === 'Todas' ? query === '' : query === filter) && styles.filterPillActive]}>
                <Icon name={filter === 'Todas' ? 'route' : filter === 'Terminal' ? 'bus' : filter === 'Universidad' ? 'star' : 'location'} color="#34755c" size={17} />
                <Text style={styles.filterText}>{filter}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.list}>
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((key) => (
                <View key={key} style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative, { gap: 12, padding: 20 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton width={70} height={28} borderRadius={14} />
                    <Skeleton width={20} height={20} borderRadius={10} />
                  </View>
                  <Skeleton width="85%" height={20} borderRadius={4} />
                  <Skeleton width="45%" height={14} borderRadius={4} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <Skeleton width={110} height={24} borderRadius={12} />
                    <Skeleton width={90} height={24} borderRadius={12} />
                  </View>
                </View>
              ))
            : filteredRoutes.map((item, index) => (
                <Pressable key={item.key} onPress={() => router.push({ pathname: '/', params: { routeCode: item.code } })} style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative]}>
                  <Image source={require('@/assets/images/hoja3.png')} resizeMode="contain" style={styles.cardLeaf} />
                  <View style={styles.cardTop}>
                    <View style={[styles.codePill, { backgroundColor: ['#e5f3ee', '#edf5e7', '#f0ecf8'][index % 3] }]}><Icon name="bus" color={['#268060', '#59945e', '#7a5da6'][index % 3]} size={19} /><Text style={[styles.code, { color: ['#268060', '#59945e', '#7a5da6'][index % 3] }]}>{item.code}</Text></View>
                    <Pressable onPress={async (event) => { event.stopPropagation(); const favorites = await toggleFavorite({ id: `route:${item.key}`, type: 'route', title: item.code, subtitle: item.name }); setFavoriteIds(favorites.map((favorite) => favorite.id)); }}>
                      <Icon name="heart" color={favoriteIds.includes(`route:${item.key}`) ? '#d8957d' : '#728092'} size={20} />
                    </Pressable>
                  </View>
                  <Text style={styles.routeName}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                  <View style={styles.cardBottom}>
                    <View style={styles.schedulePill}><Icon name="clock" color="#366a58" size={16} /><Text style={styles.schedule}>Lun-Sab: {item.schedule.weekdays.hours}</Text></View>
                    <View style={styles.routeButton}><Text style={styles.routeButtonText}>Ver recorrido</Text><Icon name="arrow" color="#2f8062" size={17} /></View>
                  </View>
                </Pressable>
              ))}
        </View>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 54, paddingTop: 34, paddingBottom: 12, maxWidth: 1580, width: '100%', alignSelf: 'center', backgroundColor: '#fffdf8' },
  contentPhone: { paddingHorizontal: 20, paddingTop: 30 },
  contentNative: { paddingHorizontal: 20, paddingTop: 26 },
  heroBlock: { position: 'relative', padding: 28, borderRadius: 30, backgroundColor: '#f0f8f2', borderWidth: 1, borderColor: '#dcecdf', overflow: 'hidden' },
  heroLeafLeft: { position: 'absolute', left: -36, top: 18, width: 120, height: 120, opacity: 0.56, transform: [{ rotate: '-18deg' }] },
  heroLeafRight: { position: 'absolute', right: 25, top: -20, width: 125, height: 125, opacity: 0.38, transform: [{ rotate: '18deg' }] },
  eyebrow: { color: '#57956f', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#17283b', fontSize: 42, fontWeight: '800', marginTop: 8 },
  titleAccent: { color: '#58a77b', fontFamily: 'Segoe Print', fontStyle: 'italic', fontWeight: '700' },
  titleNative: { fontSize: 30, lineHeight: 36 },
  subtitle: { color: '#496b60', fontSize: 16, marginTop: 8 },
  subtitleNative: { fontSize: 15, lineHeight: 22 },
  searchBox: { marginTop: 24, height: 58, maxWidth: 760, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#cfe4d5', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, boxShadow: '0 7px 18px rgba(72, 112, 91, 0.08)' },
  searchBoxNative: { marginTop: 24, width: '100%', maxWidth: undefined, borderRadius: 17 },
  searchInput: { flex: 1, color: '#17283b', fontSize: 15 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  filterPill: { minHeight: 40, paddingHorizontal: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.76)', borderWidth: 1, borderColor: '#d8e9dc' },
  filterPillActive: { backgroundColor: '#dcefe4', borderColor: '#b9ddc5' },
  filterText: { color: '#356650', fontSize: 13, fontWeight: '700' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingTop: 26, paddingBottom: 0 },
  card: { flexGrow: 1, flexBasis: '46%', minHeight: 190, backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#dce9df', padding: 20, overflow: 'hidden', boxShadow: '0 7px 18px rgba(67, 100, 83, 0.07)' },
  cardPhone: { flexBasis: '100%', minHeight: 0 },
  cardNative: { padding: 18, borderRadius: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeaf: { position: 'absolute', left: -18, bottom: -26, width: 105, height: 105, opacity: 0.22 },
  codePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9 },
  code: { fontSize: 15, fontWeight: '800' },
  routeName: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 20 },
  category: { color: '#789086', fontSize: 12, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20 },
  schedulePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#f2f8f4', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8 },
  schedule: { color: '#366a58', fontSize: 12, fontWeight: '700' },
  routeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, backgroundColor: '#e7f4ec', paddingHorizontal: 15, paddingVertical: 10 },
  routeButtonText: { color: '#2f8062', fontSize: 13, fontWeight: '800' },
});
