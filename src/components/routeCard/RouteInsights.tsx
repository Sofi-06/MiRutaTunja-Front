import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

const recommendations = [
  ['Ruta panorámica del Centro Histórico', 'Recorre la Plaza de Bolívar, la Casa del Fundador y el Puente de Boyacá.', 'Turística', '45 min'],
  ['Corredor universitario', 'Conexión directa entre el centro, la UPTC y la zona norte.', 'Alta demanda', '22 min'],
  ['Circuito de parques', 'Bosque de la República, Pozo de Donato y Parque Santander.', 'Tranquila', '34 min'],
] as const;

const recentSearches = [
  ['Plaza de Bolívar', 'UPTC', 'hoy, 7:42 a. m.'],
  ['Terminal', 'Centro Comercial Unicentro', 'ayer, 6:10 p. m.'],
  ['Hospital San Rafael', 'Barrio Asís', 'lun, 1:25 p. m.'],
] as const;

export default function RouteInsights({ isCompact = false }: Readonly<{ isCompact?: boolean }>) {
  return (
    <View style={[styles.insightsGrid, isCompact && styles.insightsGridPhone]}>
      <View style={[styles.insightPanel, styles.insightPanelBlue, isCompact && styles.insightPanelPhone]}>
        <Text style={[styles.insightTitle, isCompact && styles.insightTitlePhone]}>Rutas recomendadas</Text>
        <Text style={styles.insightDescription}>Selección basada en la hora del día y tu ubicación actual.</Text>
        <View style={[styles.recommendationList, isCompact && styles.recommendationListPhone]}>
          {recommendations.map(([title, description, tag, duration]) => (
            <Pressable key={title} style={[styles.recommendationRow, isCompact && styles.recommendationRowPhone]}>
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
          {recentSearches.map(([origin, destination, date]) => (
            <Pressable key={`${origin}-${destination}`} style={[styles.recentRow, isCompact && styles.recentRowPhone]}>
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
        <Pressable style={styles.historyButton}>
          <Text style={styles.historyButtonText}>Ver historial completo</Text>
        </Pressable>
      </View>
    </View>
  );
}
