import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';
import { RecentSearch } from '@/services/localData';

const sampleRecentSearches = [
  ['Plaza de Bolívar', 'UPTC', 'hoy, 7:42 a. m.'],
  ['Terminal', 'Centro Comercial Unicentro', 'ayer, 6:10 p. m.'],
  ['Hospital San Rafael', 'Barrio Asís', 'lun, 1:25 p. m.'],
] as const;

const popularPlaces = [
  { title: 'Centro histórico', icon: 'location' as const, color: '#e5a81c', route: 'R15' },
  { title: 'Terminal de buses', icon: 'bus' as const, color: '#4b9c61', route: 'R7' },
  { title: 'Universidades', icon: 'star' as const, color: '#d2a313', route: 'R11' },
  { title: 'Lugares turísticos', icon: 'target' as const, color: '#8c54ad', route: null },
] as const;

type RouteInsightsProps = Readonly<{
  isCompact?: boolean;
  recentSearches?: RecentSearch[];
  onSelectRoute?: (code: string) => void;
  onSelectRecent?: (origin: string, destination: string) => void;
}>;

export default function RouteInsights({ isCompact = false, recentSearches = [], onSelectRoute, onSelectRecent }: RouteInsightsProps) {
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
            <Text style={styles.insightDescription}>Descubre los sitios más visitados y llega fácilmente.</Text>
          </View>
          {!isCompact && <Pressable onPress={() => router.push('/explore')}><Text style={styles.insightLink}>Ver todas  →</Text></Pressable>}
        </View>
        <View style={styles.popularPlacesGrid}>
          {popularPlaces.map((place) => (
            <Pressable
              key={place.title}
              onPress={() => place.route ? onSelectRoute?.(place.route) : router.push('/explore')}
              style={styles.popularPlaceCard}
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
          {!isCompact && <Text style={styles.insightLink}>Ver todas  →</Text>}
        </View>
        <View style={[styles.recentList, isCompact && styles.recentListPhone]}>
          {visibleSearches.map(([origin, destination, date]) => (
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
