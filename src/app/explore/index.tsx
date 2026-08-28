import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import { getFavorites, toggleFavorite } from '@/services/localData';

const places = [
  { name: 'Plaza de Bolívar', category: 'Historia y cultura', detail: 'Centro histórico de Tunja', icon: 'location' as const },
  { name: 'Pozo de Donato', category: 'Patrimonio', detail: 'Monumento tradicional del centro', icon: 'star' as const },
  { name: 'Estadio La Independencia', category: 'Deporte', detail: 'Escenarios y actividades deportivas', icon: 'route' as const },
  { name: 'Parque Santander', category: 'Naturaleza', detail: 'Espacio verde para caminar y descansar', icon: 'location' as const },
  { name: 'Casa del Fundador', category: 'Historia y cultura', detail: 'Museo y memoria de la ciudad', icon: 'star' as const },
  { name: 'Universidad Pedagógica y Tecnológica', category: 'Educación', detail: 'Punto de interés universitario', icon: 'bus' as const },
  { name: 'Puente de Boyacá', category: 'Historia y cultura', detail: 'Monumento nacional de la independencia', icon: 'star' as const },
  { name: 'Catedral Basílica Metropolitana', category: 'Historia y cultura', detail: 'Arquitectura religiosa en el centro histórico', icon: 'location' as const },
  { name: 'Iglesia de San Laureano', category: 'Historia y cultura', detail: 'Uno de los templos tradicionales de Tunja', icon: 'star' as const },
  { name: 'Convento de Santa Clara la Real', category: 'Historia y cultura', detail: 'Patrimonio colonial de la ciudad', icon: 'location' as const },
  { name: 'Bosque de la República', category: 'Naturaleza', detail: 'Zona verde y espacio recreativo urbano', icon: 'location' as const },
  { name: 'Parque Recreacional del Norte', category: 'Naturaleza', detail: 'Senderos y actividades al aire libre', icon: 'route' as const },
  { name: 'Centro Comercial Unicentro', category: 'Compras y gastronomía', detail: 'Restaurantes, comercios y servicios', icon: 'location' as const },
  { name: 'Centro Comercial Viva Tunja', category: 'Compras y gastronomía', detail: 'Tiendas y oferta gastronómica', icon: 'location' as const },
  { name: 'Mercado del Sur', category: 'Compras y gastronomía', detail: 'Productos locales y cocina tradicional', icon: 'star' as const },
  { name: 'Terminal de Transportes', category: 'Movilidad', detail: 'Conexión regional e intermunicipal', icon: 'bus' as const },
  { name: 'Parque Pinzón', category: 'Naturaleza', detail: 'Espacio urbano para descansar', icon: 'location' as const },
  { name: 'Museo Casa Cultural Gustavo Rojas Pinilla', category: 'Historia y cultura', detail: 'Exposiciones y memoria local', icon: 'star' as const },
  { name: 'Biblioteca Jorge Palacios Preciado', category: 'Educación', detail: 'Consulta, lectura y actividades culturales', icon: 'location' as const },
  { name: 'Cerro de San Lázaro', category: 'Naturaleza', detail: 'Mirador con vistas de la ciudad', icon: 'route' as const },
  { name: 'Plaza Real', category: 'Compras y gastronomía', detail: 'Comercio y servicios en la zona central', icon: 'location' as const },
];

export default function ExploreScreen() {
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
  const visiblePlaces = places.filter((place) => (category === 'Todos' || place.category === category) && `${place.name} ${place.category}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <Text style={styles.eyebrow}>TURISMO EN TUNJA</Text>
        <Text style={[styles.title, isNative && styles.titleNative]}>Descubre Tunja</Text>
        <Text style={styles.subtitle}>Encuentra lugares históricos, naturaleza, gastronomía y planes para recorrer la ciudad.</Text>
        <View style={[styles.searchBox, isNative && styles.searchBoxNative]}>
          <Icon name="search" color="#728092" size={20} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar un lugar en Tunja" placeholderTextColor="#728092" style={styles.searchInput} />
        </View>
        <View style={styles.categories}>
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryPill, category === item && styles.categoryPillActive]}>
              <Text style={category === item ? styles.categoryTextActive : styles.categoryText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.list}>
          {visiblePlaces.map((item) => (
            <Pressable key={item.name} style={[styles.card, isCompact && styles.cardPhone, isNative && styles.cardNative]}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}><Icon name={item.icon} color="#3f719b" size={24} /></View>
                <Pressable onPress={async (event) => { event.stopPropagation(); const favorites = await toggleFavorite({ id: `place:${item.name}`, type: 'place', title: item.name, subtitle: item.category }); setFavoriteIds(favorites.map((favorite) => favorite.id)); }}>
                  <Icon name="heart" color={favoriteIds.includes(`place:${item.name}`) ? '#d8957d' : '#728092'} size={21} />
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
