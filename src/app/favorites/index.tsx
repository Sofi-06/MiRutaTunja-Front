import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import { Favorite, getFavorites, toggleFavorite } from '@/services/localData';

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isNative = Platform.OS !== 'web';
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useFocusEffect(useCallback(() => {
    void getFavorites().then(setFavorites);
  }, []));

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <Text style={styles.eyebrow}>TU ESPACIO</Text>
        <Text style={[styles.title, isNative && styles.titleNative]}>Favoritos</Text>
        <Text style={styles.subtitle}>Guarda aquí tus rutas y lugares preferidos para encontrarlos más rápido.</Text>
        {favorites.length === 0 ? <View style={[styles.emptyCard, isNative && styles.emptyCardNative]}>
          <View style={styles.iconCircle}><Icon name="heart" color="#3f719b" size={30} /></View>
          <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
          <Text style={styles.emptyText}>Cuando guardes una ruta o un lugar de interés aparecerá en esta lista.</Text>
          <View style={[styles.actions, isNative && styles.actionsNative]}>
            <Pressable onPress={() => router.push('/routes' as never)} style={[styles.primaryButton, isNative && styles.actionButtonNative]}><Text style={styles.primaryText}>Ver rutas</Text></Pressable>
            <Pressable onPress={() => router.push('/explore')} style={[styles.secondaryButton, isNative && styles.actionButtonNative]}><Text style={styles.secondaryText}>Explorar Tunja</Text></Pressable>
          </View>
        </View> : <View style={styles.favoriteList}>
          {favorites.map((favorite) => (
            <View key={favorite.id} style={[styles.favoriteRow, isCompact && styles.favoriteRowPhone]}>
              <View style={styles.favoriteIcon}><Icon name={favorite.type === 'route' ? 'bus' : 'location'} color="#3f719b" size={20} /></View>
              <View style={styles.favoriteCopy}><Text style={styles.favoriteTitle}>{favorite.title}</Text><Text style={styles.favoriteSubtitle}>{favorite.subtitle}</Text></View>
              <Pressable onPress={async () => setFavorites(await toggleFavorite(favorite))} accessibilityLabel={`Quitar ${favorite.title} de favoritos`}><Icon name="trash" color="#d8957d" size={21} /></Pressable>
            </View>
          ))}
        </View>}
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
  emptyCard: { marginTop: 34, minHeight: 330, maxWidth: 760, alignSelf: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#dce8ef', alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyCardNative: { minHeight: 300, padding: 24, marginTop: 26 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#edf6fc', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#17283b', fontSize: 22, fontWeight: '800', marginTop: 18 },
  emptyText: { color: '#728092', fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center', maxWidth: 480 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionsNative: { flexDirection: 'column', width: '100%' },
  primaryButton: { backgroundColor: '#3f719b', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#cfe2ef', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  actionButtonNative: { width: '100%', alignItems: 'center' },
  secondaryText: { color: '#2b5479', fontWeight: '700' },
  favoriteList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 30, gap: 16, maxWidth: 1300 },
  favoriteRow: { width: '48%', minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce8ef', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  favoriteRowPhone: { width: '100%', padding: 16 },
  favoriteIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#edf6fc', alignItems: 'center', justifyContent: 'center' },
  favoriteCopy: { flex: 1 },
  favoriteTitle: { color: '#17283b', fontSize: 16, fontWeight: '800' },
  favoriteSubtitle: { color: '#728092', fontSize: 13, marginTop: 3 },
});
