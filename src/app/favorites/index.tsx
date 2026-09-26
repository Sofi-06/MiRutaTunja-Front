import { useCallback, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { Favorite, getFavorites, toggleFavorite } from '@/services/localData';

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isNative = Platform.OS !== 'web';
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    void getFavorites().then((data) => {
      setFavorites(data);
      setIsLoading(false);
    });
  }, []));

  return (
    <PageScaffold>
      <View style={[styles.content, isCompact && styles.contentPhone, isNative && styles.contentNative]}>
        <View style={styles.heroBlock}>
          {!isCompact && <Image source={require('@/assets/images/hoja4.png')} resizeMode="contain" style={styles.heroLeafLeft} />}
          {!isCompact && <Image source={require('@/assets/images/hoja2.png')} resizeMode="contain" style={styles.heroLeafRight} />}
          <Text style={styles.eyebrow}>TU ESPACIO</Text>
          <Text style={[styles.title, isNative && styles.titleNative]}>Tus <Text style={styles.titleAccent}>favoritos</Text></Text>
          <Text style={styles.subtitle}>Guarda aquí tus rutas y lugares preferidos para encontrarlos más rápido.</Text>
        </View>
        {isLoading ? (
          <View style={styles.favoriteList}>
            {[1, 2, 3].map((key) => (
              <View key={key} style={[styles.favoriteRow, isCompact && styles.favoriteRowPhone, { paddingVertical: 16 }]}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="45%" height={16} borderRadius={4} />
                  <Skeleton width="70%" height={12} borderRadius={4} />
                </View>
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
            ))}
          </View>
        ) : favorites.length === 0 ? (
          <View style={[styles.emptyCard, isNative && styles.emptyCardNative]}>
            <View style={styles.iconCircle}><Icon name="heart" color="#3f719b" size={30} /></View>
            <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
            <Text style={styles.emptyText}>Cuando guardes una ruta o un lugar de interés aparecerá en esta lista.</Text>
            <View style={[styles.actions, isNative && styles.actionsNative]}>
              <Pressable onPress={() => router.push('/routes' as never)} style={[styles.primaryButton, isNative && styles.actionButtonNative]}><Text style={styles.primaryText}>Ver rutas</Text></Pressable>
              <Pressable onPress={() => router.push('/explore')} style={[styles.secondaryButton, isNative && styles.actionButtonNative]}><Text style={styles.secondaryText}>Explorar Tunja</Text></Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.favoriteList}>
            {favorites.map((favorite) => (
              <View key={favorite.id} style={[styles.favoriteRow, isCompact && styles.favoriteRowPhone]}>
                <Image source={require('@/assets/images/hoja3.png')} resizeMode="contain" style={styles.favoriteLeaf} />
                <View style={styles.favoriteIcon}><Icon name={favorite.type === 'route' ? 'bus' : 'location'} color="#3f719b" size={20} /></View>
                <View style={styles.favoriteCopy}><Text style={styles.favoriteTitle}>{favorite.title}</Text><Text style={styles.favoriteSubtitle}>{favorite.subtitle}</Text></View>
                <Pressable onPress={async () => setFavorites(await toggleFavorite(favorite))} accessibilityLabel={`Quitar ${favorite.title} de favoritos`}><Icon name="trash" color="#d8957d" size={21} /></Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 54, paddingTop: 34, paddingBottom: 12, maxWidth: 1580, width: '100%', alignSelf: 'center', backgroundColor: '#fffdf8' },
  contentPhone: { paddingHorizontal: 20, paddingTop: 30 },
  contentNative: { paddingHorizontal: 20, paddingTop: 26 },
  heroBlock: { position: 'relative', padding: 28, borderRadius: 30, backgroundColor: '#f0f8f2', borderWidth: 1, borderColor: '#dcecdf', overflow: 'hidden' },
  heroLeafLeft: { position: 'absolute', left: -36, bottom: -38, width: 140, height: 140, opacity: 0.42, transform: [{ rotate: '-10deg' }] },
  heroLeafRight: { position: 'absolute', right: 28, top: -28, width: 130, height: 130, opacity: 0.38, transform: [{ rotate: '20deg' }] },
  eyebrow: { color: '#57956f', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#17283b', fontSize: 42, fontWeight: '800', marginTop: 8 },
  titleAccent: { color: '#58a77b', fontFamily: 'Segoe Print', fontStyle: 'italic' },
  titleNative: { fontSize: 30, lineHeight: 36 },
  subtitle: { color: '#496b60', fontSize: 16, marginTop: 8 },
  emptyCard: { marginTop: 28, minHeight: 330, maxWidth: 760, alignSelf: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 26, borderWidth: 1, borderColor: '#dce9df', alignItems: 'center', justifyContent: 'center', padding: 40, boxShadow: '0 9px 24px rgba(67, 100, 83, 0.08)' },
  emptyCardNative: { minHeight: 300, padding: 24, marginTop: 26 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e3f3e9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#17283b', fontSize: 22, fontWeight: '800', marginTop: 18 },
  emptyText: { color: '#728092', fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'center', maxWidth: 480 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionsNative: { flexDirection: 'column', width: '100%' },
  primaryButton: { backgroundColor: '#3f8c69', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#c9e2d1', backgroundColor: '#f1f8f3', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  actionButtonNative: { width: '100%', alignItems: 'center' },
  secondaryText: { color: '#397258', fontWeight: '700' },
  favoriteList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 30, gap: 16, maxWidth: 1300 },
  favoriteRow: { position: 'relative', width: '48%', minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce9df', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', boxShadow: '0 7px 18px rgba(67, 100, 83, 0.07)' },
  favoriteRowPhone: { width: '100%', padding: 16 },
  favoriteLeaf: { position: 'absolute', right: -22, bottom: -27, width: 95, height: 95, opacity: 0.16 },
  favoriteIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e7f4ec', alignItems: 'center', justifyContent: 'center' },
  favoriteCopy: { flex: 1 },
  favoriteTitle: { color: '#17283b', fontSize: 16, fontWeight: '800' },
  favoriteSubtitle: { color: '#728092', fontSize: 13, marginTop: 3 },
});
