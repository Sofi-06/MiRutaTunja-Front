import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
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
        <View style={styles.heroBlock}>
          {!isCompact && <Image source={require('@/assets/images/hoja1.png')} resizeMode="contain" style={styles.heroLeafLeft} />}
          {!isCompact && <Image source={require('@/assets/images/hoja2.png')} resizeMode="contain" style={styles.heroLeafRight} />}
          <Text style={styles.eyebrow}>TURISMO EN TUNJA</Text>
          <Text style={[styles.title, isNative && styles.titleNative]}>Descubre <Text style={styles.titleAccent}>Tunja</Text></Text>
          <Text style={styles.subtitle}>
            Encuentra lugares históricos, naturaleza, gastronomía y planes para recorrer la ciudad.
          </Text>
          <View style={[styles.searchBox, isNative && styles.searchBoxNative]}>
            <Icon name="search" color="#527267" size={22} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar un lugar en Tunja"
              placeholderTextColor="#789087"
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
        </View>
        <View style={styles.list}>
          {visiblePlaces.map((item) => (
            <Pressable
              key={item.id || item.name}
              onPress={() => handleSelectPlace(item)}
              style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative]}
            >
              <Image source={require('@/assets/images/hoja3.png')} resizeMode="contain" style={styles.cardLeaf} />
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
  content: { flex: 1, paddingHorizontal: 54, paddingTop: 34, paddingBottom: 12, maxWidth: 1580, width: '100%', alignSelf: 'center', backgroundColor: '#fffdf8' },
  contentPhone: { paddingHorizontal: 20, paddingTop: 30 },
  contentNative: { paddingHorizontal: 20, paddingTop: 26 },
  heroBlock: { position: 'relative', padding: 28, borderRadius: 30, backgroundColor: '#f0f8f2', borderWidth: 1, borderColor: '#dcecdf', overflow: 'hidden' },
  heroLeafLeft: { position: 'absolute', left: -38, top: 15, width: 125, height: 125, opacity: 0.52, transform: [{ rotate: '-16deg' }] },
  heroLeafRight: { position: 'absolute', right: 28, top: -25, width: 130, height: 130, opacity: 0.38, transform: [{ rotate: '22deg' }] },
  eyebrow: { color: '#57956f', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#17283b', fontSize: 42, fontWeight: '800', marginTop: 8 },
  titleAccent: { color: '#58a77b', fontFamily: 'Segoe Print', fontStyle: 'italic' },
  titleNative: { fontSize: 30, lineHeight: 36 },
  subtitle: { color: '#496b60', fontSize: 16, marginTop: 8, maxWidth: 720 },
  searchBox: { marginTop: 24, height: 58, maxWidth: 760, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#cfe4d5', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, boxShadow: '0 7px 18px rgba(72, 112, 91, 0.08)' },
  searchBoxNative: { marginTop: 24, width: '100%', maxWidth: undefined, borderRadius: 17 },
  searchInput: { flex: 1, color: '#17283b', fontSize: 15 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  categoryPill: { borderWidth: 1, borderColor: '#d8e9dc', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.78)', paddingHorizontal: 15, paddingVertical: 9 },
  categoryPillActive: { borderColor: '#b9ddc5', backgroundColor: '#dcefe4' },
  categoryText: { color: '#688076', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#2f7558', fontSize: 13, fontWeight: '800' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, paddingTop: 26, paddingBottom: 0 },
  card: { flexGrow: 1, flexBasis: '30%', minHeight: 205, backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#dce9df', padding: 20, overflow: 'hidden', boxShadow: '0 7px 18px rgba(67, 100, 83, 0.07)' },
  cardPhone: { flexBasis: '100%', minHeight: 0 },
  cardNative: { padding: 18, borderRadius: 20 },
  cardLeaf: { position: 'absolute', right: -20, bottom: -28, width: 105, height: 105, opacity: 0.19 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e7f4ec', alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeName: { color: '#17283b', fontSize: 18, fontWeight: '800', marginTop: 18 },
  placeCategory: { color: '#57956f', fontSize: 12, fontWeight: '800', marginTop: 6 },
  placeDetail: { color: '#71857c', fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: '85%' },
});
