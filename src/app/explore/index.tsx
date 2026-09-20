import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import placesData from '@/data/places.json';
import { getFavorites, toggleFavorite } from '@/services/localData';

type PlaceItem = {
  id: string;
  name: string;
  category: string;
  detail: string;
  icon: 'location' | 'star' | 'route' | 'bus';
  lat: number;
  lng: number;
};

const places: PlaceItem[] = placesData as PlaceItem[];

export default function ExploreScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isNative = Platform.OS !== 'web';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    void getFavorites().then((favorites) => setFavoriteIds(favorites.map((favorite) => favorite.id)));
  }, []);

  const categories = ['Todos', ...Array.from(new Set(places.map((place) => place.category)))];
  const visiblePlaces = places.filter(
    (place) =>
      (category === 'Todos' || place.category === category) &&
      `${place.name} ${place.category}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPlace = (place: PlaceItem) => {
    router.push({
      pathname: '/',
      params: {
        destLat: place.lat.toString(),
        destLng: place.lng.toString(),
        destName: place.name,
      },
    });
  };

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <Text style={styles.eyebrow}>TURISMO EN TUNJA</Text>
        <Text style={[styles.title, isNative && styles.titleNative]}>Descubre Tunja</Text>
        <Text style={styles.subtitle}>
          Encuentra lugares históricos, naturaleza, gastronomía y planes para recorrer la ciudad.
        </Text>
        <View style={[styles.searchBox, isNative && styles.searchBoxNative]}>
          <Icon name="search" color="#728092" size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar un lugar en Tunja"
            placeholderTextColor="#728092"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.categories}>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.categoryPill, category === item && styles.categoryPillActive]}
            >
              <Text style={category === item ? styles.categoryTextActive : styles.categoryText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.list}>
          {visiblePlaces.map((item) => (
            <Pressable
              key={item.id || item.name}
              onPress={() => handleSelectPlace(item)}
              style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Icon name={item.icon} color="#3f719b" size={24} />
                </View>
                <Pressable
                  onPress={async (event) => {
                    event.stopPropagation();
                    const favorites = await toggleFavorite({
                      id: `place:${item.name}`,
                      type: 'place',
                      title: item.name,
                      subtitle: item.category,
                    });
                    setFavoriteIds(favorites.map((favorite) => favorite.id));
                  }}
                >
                  <Icon
                    name="heart"
                    color={favoriteIds.includes(`place:${item.name}`) ? '#d8957d' : '#728092'}
                    size={21}
                  />
                </Pressable>
              </View>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeCategory}>{item.category}</Text>
              <Text style={styles.placeDetail}>{item.detail}</Text>
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
  subtitle: { color: '#2b5479', fontSize: 16, marginTop: 10, maxWidth: 720 },
  searchBox: { marginTop: 28, height: 54, maxWidth: 620, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#dce8ef', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  searchBoxNative: { marginTop: 24, width: '100%', maxWidth: undefined, borderRadius: 17 },
  searchInput: { flex: 1, color: '#17283b', fontSize: 15 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  categoryPill: { borderWidth: 1, borderColor: '#dce8ef', borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9 },
  categoryPillActive: { borderColor: '#cfe2ef', backgroundColor: '#edf6fc' },
  categoryText: { color: '#728092', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#2b5479', fontSize: 13, fontWeight: '700' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 24, paddingBottom: 48 },
  card: { flexGrow: 1, flexBasis: '30%', minHeight: 205, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#dce8ef', padding: 20 },
  cardPhone: { flexBasis: '100%', minHeight: 0 },
  cardNative: { padding: 18, borderRadius: 20 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#edf6fc', alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeName: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 18 },
  placeCategory: { color: '#d8957d', fontSize: 12, fontWeight: '800', marginTop: 6 },
  placeDetail: { color: '#728092', fontSize: 13, lineHeight: 19, marginTop: 12 },
});
