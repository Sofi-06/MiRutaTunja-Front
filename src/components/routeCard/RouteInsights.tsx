import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';
import { RecentSearch } from '@/services/localData';
import routesMetadata from '@/assets/routes/routes-metadata.json';

const recommendations = [
  ['Ruta panorámica del Centro Histórico', 'Recorre la Plaza de Bolívar, la Casa del Fundador y el Puente de Boyacá.', 'Turística', '45 min'],
  ['Corredor universitario', 'Conexión directa entre el centro, la UPTC y la zona norte.', 'Alta demanda', '22 min'],
  ['Circuito de parques', 'Bosque de la República, Pozo de Donato y Parque Santander.', 'Tranquila', '34 min'],
] as const;

const sampleRecentSearches = [
  ['Plaza de Bolívar', 'UPTC', 'hoy, 7:42 a. m.'],
  ['Terminal', 'Centro Comercial Unicentro', 'ayer, 6:10 p. m.'],
  ['Hospital San Rafael', 'Barrio Asís', 'lun, 1:25 p. m.'],
] as const;

const realRecommendations = [
  { code: 'R15', tag: 'Turística', duration: '45 min' },
  { code: 'R7', tag: 'Alta demanda', duration: '22 min' },
  { code: 'R11', tag: 'Tranquila', duration: '34 min' },
].map((item) => ({
  ...item,
  title: routesMetadata[item.code as keyof typeof routesMetadata].name,
  description: routesMetadata[item.code as keyof typeof routesMetadata].category,
}));

type RouteInsightsProps = Readonly<{
  isCompact?: boolean;
  recentSearches?: RecentSearch[];
  onSelectRoute?: (code: string) => void;
  onSelectRecent?: (origin: string, destination: string) => void;
}>;

export default function RouteInsights({ isCompact = false, recentSearches = [], onSelectRoute, onSelectRecent }: RouteInsightsProps) {
  const visibleSearches = recentSearches.length > 0
    ? recentSearches.map(({ origin, destination, createdAt }) => [origin, destination, new Date(createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })] as const)
    : [];

  return (
    <View style={[styles.insightsGrid, isCompact && styles.insightsGridPhone]}>
      <View style={[styles.insightPanel, styles.insightPanelBlue, isCompact && styles.insightPanelPhone]}>
        <Text style={[styles.insightTitle, isCompact && styles.insightTitlePhone]}>Rutas recomendadas</Text>
        <Text style={styles.insightDescription}>Selección basada en la hora del día y tu ubicación actual.</Text>
        <View style={[styles.recommendationList, isCompact && styles.recommendationListPhone]}>
          {realRecommendations.map(({ code, title, description, tag, duration }) => (
            <Pressable key={code} onPress={() => onSelectRoute?.(code)} style={[styles.recommendationRow, isCompact && styles.recommendationRowPhone]}>
              <View style={[styles.recommendationIcon, isCompact && styles.recommendationIconPhone]}>
                <Icon name="target" color={colors.blueDark} size={17} />
              </View>
              <View style={styles.recommendationCopy}>
                <View style={styles.recommendationTitleRow}>
                  <Text style={[styles.recommendationTitle, isCompact && styles.recommendationTitlePhone]}>{title}</Text>
                  <Text style={styles.recommendationTag}>{tag}</Text>
                </View>
                <Text style={[styles.recommendationDescription, isCompact && styles.recommendationDescriptionPhone]}>{description}</Text>
              </View>
              <Text style={[styles.recommendationDuration, isCompact && styles.recommendationDurationPhone]}>{duration}</Text>
              <Icon name="chevron" size={15} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.insightPanel, styles.insightPanelGreen, isCompact && styles.insightPanelPhone]}>
        <View style={styles.insightTitleRow}>
          <Icon name="history" color={colors.muted} size={18} />
          <Text style={[styles.insightTitle, isCompact && styles.insightTitlePhone]}>Últimas consultas</Text>
        </View>
        <View style={[styles.recentList, isCompact && styles.recentListPhone]}>
          {visibleSearches.length === 0 && <Text style={styles.recentDate}>Aún no has realizado consultas.</Text>}
          {visibleSearches.map(([origin, destination, date]) => (
            <Pressable key={`${origin}-${destination}`} onPress={() => onSelectRecent?.(origin, destination)} style={[styles.recentRow, isCompact && styles.recentRowPhone]}>
              <View style={styles.recentRoute}>
                <View style={styles.recentDot} />
                <Text style={styles.recentText}>{origin}</Text>
                <Icon name="chevron" size={14} />
                <Text style={styles.recentText}>{destination}</Text>
              </View>
              <Text style={styles.recentDate}>{date}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
