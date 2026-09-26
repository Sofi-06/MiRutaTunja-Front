import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { colors, styles } from '@/styles/home.styles';
import { RecentSearch } from '@/services/localData';

const sampleRecentSearches = [
  ['Plaza de Bolívar', 'UPTC', 'hoy, 7:42 a. m.'],
  ['Terminal', 'Centro Comercial Unicentro', 'ayer, 6:10 p. m.'],
  ['Hospital San Rafael', 'Barrio Asís', 'lun, 1:25 p. m.'],
] as const;

const popularPlaces = [
  { title: 'Plaza de Bolívar', icon: 'location' as const, color: '#e5a81c', lat: 5.5324627, lng: -73.3615504 },
  { title: 'Terminal de Transportes', icon: 'bus' as const, color: '#4b9c61', lat: 5.530809, lng: -73.34496 },
  { title: 'Universidad UPTC', icon: 'star' as const, color: '#d2a313', lat: 5.5562, lng: -73.3516 },
  { title: 'Centro Comercial Unicentro', icon: 'target' as const, color: '#8c54ad', lat: 5.5458, lng: -73.3519 },
] as const;

type RouteInsightsProps = Readonly<{
  isCompact?: boolean;
  isLoading?: boolean;
  recentSearches?: RecentSearch[];
  onSelectPlace?: (place: { name: string; lat: number; lng: number }) => void;
  onSelectRecent?: (origin: string, destination: string) => void;
}>;

export default function RouteInsights({ isCompact = false, isLoading = false, recentSearches = [], onSelectRecent, onSelectPlace }: RouteInsightsProps) {
  const router = useRouter();
  const visibleSearches = recentSearches.length > 0
    ? recentSearches.map(({ origin, destination, createdAt }) => [origin, destination, new Date(createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })] as const)
    : sampleRecentSearches;

  return (
    <View style={[styles.insightsGrid, isCompact && styles.insightsGridPhone]}>
      <View style={[styles.insightPanel, styles.insightPanelBlue, isCompact && styles.insightPanelPhone]}>
        <View style={styles.insightPanelHeader}>
          <View>
            <View style={styles.insightTitleRow}>
              <Icon name="location" color="#e4a91a" size={20} />
              <Text style={[styles.insightTitle, isCompact && styles.insightTitlePhone]}>Lugares populares en Tunja</Text>
            </View>
            <Text style={styles.insightDescription}>Los destinos más consultados para moverte por la ciudad.</Text>
          </View>
          {!isCompact && <Pressable onPress={() => router.push('/explore')}><Text style={styles.insightLink}>Ver todas  →</Text></Pressable>}
        </View>
        <View style={[styles.popularPlacesGrid, isCompact && styles.popularPlacesGridPhone]}>
          {isLoading
            ? [1, 2, 3, 4].map((key) => (
                <View key={key} style={[styles.popularPlaceCard, isCompact && styles.popularPlaceCardPhone, { overflow: 'hidden', gap: 6 }]}>
                  <Skeleton width="100%" height={100} borderRadius={12} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6 }}>
                    <Skeleton width={16} height={16} borderRadius={8} />
                    <Skeleton width="70%" height={14} borderRadius={4} />
                  </View>
                </View>
              ))
            : popularPlaces.map((place) => (
                <Pressable
                  key={place.title}
                  onPress={() => onSelectPlace?.({ name: place.title, lat: place.lat, lng: place.lng })}
                  style={[styles.popularPlaceCard, isCompact && styles.popularPlaceCardPhone]}
                >
                  <Image source={require('@/assets/images/tunja.jpg')} resizeMode="cover" style={styles.popularPlaceImage} />
                  <View style={styles.popularPlaceFooter}>
                    <Icon name={place.icon} color={place.color} size={16} />
                    <Text numberOfLines={1} style={styles.popularPlaceTitle}>{place.title}</Text>
                    <View style={styles.popularPlaceArrow}><Icon name="chevron" color={colors.muted} size={15} /></View>
                  </View>
                </Pressable>
              ))}
        </View>
      </View>

      <View style={[styles.insightPanel, styles.insightPanelGreen, isCompact && styles.insightPanelPhone]}>
        <View style={styles.insightPanelHeader}>
          <View style={styles.insightTitleRow}>
            <Icon name="history" color="#4b9f70" size={20} />
            <Text style={[styles.insightTitle, isCompact && styles.insightTitlePhone]}>Tus rutas recientes</Text>
          </View>
        </View>
        <View style={[styles.recentList, isCompact && styles.recentListPhone]}>
          {isLoading
            ? [1, 2, 3].map((key) => (
                <View key={key} style={[styles.recentRow, isCompact && styles.recentRowPhone, { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }]}>
                  <Skeleton width="60%" height={14} borderRadius={4} />
                  <Skeleton width="25%" height={12} borderRadius={4} />
                </View>
              ))
            : visibleSearches.map(([origin, destination, date]) => (
                <Pressable key={`${origin}-${destination}`} onPress={() => onSelectRecent?.(origin, destination)} style={[styles.recentRow, isCompact && styles.recentRowPhone]}>
                  <View style={styles.recentRoute}>
                    <View style={styles.recentDot} />
                    <Text numberOfLines={1} style={styles.recentText}>{origin} - {destination}</Text>
                  </View>
                  <Text style={styles.recentDate}>{date}</Text>
                </Pressable>
              ))}
        </View>
      </View>
    </View>
  );
}
