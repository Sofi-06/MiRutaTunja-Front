import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import routesMetadata from '@/assets/routes/routes-metadata.json';
import { getFavorites, toggleFavorite } from '@/services/localData';

const routeItems = Object.entries(routesMetadata).map(([key, route]) => ({ ...route, key, code: `R-${key.replace('R', '').padStart(2, '0')}` }));

export default function RoutesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isNative = Platform.OS !== 'web';
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  useEffect(() => {
    void getFavorites().then((favorites) => setFavoriteIds(favorites.map((favorite) => favorite.id)));
  }, []);
  const filteredRoutes = routeItems.filter((route) => `${route.code} ${route.name} ${route.category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <Text style={styles.eyebrow}>MOVILIDAD URBANA</Text>
        <Text style={[styles.title, isNative && styles.titleNative]}>Rutas disponibles</Text>
        <Text style={[styles.subtitle, isNative && styles.subtitleNative]}>Consulta recorridos, horarios y frecuencia de las rutas urbanas de Tunja.</Text>
        <View style={[styles.searchBox, isNative && styles.searchBoxNative]}>
          <Icon name="search" color="#728092" size={20} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por ruta, barrio o destino" placeholderTextColor="#728092" style={styles.searchInput} />
        </View>
        <View style={styles.list}>
          {filteredRoutes.map((item, index) => (
            <Pressable key={item.key} onPress={() => router.push({ pathname: '/', params: { routeCode: item.code } })} style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative]}>
              <View style={styles.cardTop}>
                <Text style={[styles.code, { color: ['#3f719b', '#5f9b7f', '#b5794f'][index % 3] }]}>{item.code}</Text>
                <Pressable onPress={async (event) => { event.stopPropagation(); const favorites = await toggleFavorite({ id: `route:${item.key}`, type: 'route', title: item.code, subtitle: item.name }); setFavoriteIds(favorites.map((favorite) => favorite.id)); }}>
                  <Icon name="heart" color={favoriteIds.includes(`route:${item.key}`) ? '#d8957d' : '#728092'} size={20} />
                </Pressable>
              </View>
              <Text style={styles.routeName}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.schedule}>Lun-Sab: {item.schedule.weekdays.hours}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 44, paddingTop: 42, maxWidth: 1500, width: '100%', alignSelf: 'center' },
  contentPhone: { paddingHorizontal: 20, paddingTop: 30 },
  contentNative: { paddingHorizontal: 20, paddingTop: 26 },
  eyebrow: { color: '#d8957d', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#17283b', fontSize: 38, fontWeight: '800', marginTop: 10 },
  titleNative: { fontSize: 30, lineHeight: 36 },
  subtitle: { color: '#2b5479', fontSize: 16, marginTop: 10 },
  subtitleNative: { fontSize: 15, lineHeight: 22 },
  searchBox: { marginTop: 28, height: 54, maxWidth: 620, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#dce8ef', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  searchBoxNative: { marginTop: 24, width: '100%', maxWidth: undefined, borderRadius: 17 },
  searchInput: { flex: 1, color: '#17283b', fontSize: 15 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 24, paddingBottom: 48 },
  card: { flexGrow: 1, flexBasis: '46%', minHeight: 170, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#dce8ef', padding: 20 },
  cardPhone: { flexBasis: '100%', minHeight: 0 },
  cardNative: { padding: 18, borderRadius: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 15, fontWeight: '800' },
  routeName: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 20 },
  category: { color: '#728092', fontSize: 13, marginTop: 6 },
  schedule: { color: '#2b5479', fontSize: 13, fontWeight: '700', marginTop: 20 },
});
