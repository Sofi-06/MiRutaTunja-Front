import { useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView from '@/components/Map/MapView';
import SelectedRouteCard from '@/components/Map/SelectedRouteCard';
import Header from '@/components/header/Header';
import RouteCard from '@/components/routeCard/RouteCard';
import RouteInsights from '@/components/routeCard/RouteInsights';
import SearchBar from '@/components/searchBar/SearchBar';
import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const [destination, setDestination] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <View style={styles.page}>
      <SafeAreaView
        edges={['top']}
        style={[styles.header, styles.headerOverlay, isScrolled && styles.headerScrolled]}
      >
        <Header isCompact={isCompact} />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setIsScrolled(event.nativeEvent.contentOffset.y > 36)}
        scrollEventThrottle={16}
      >
        <ImageBackground
          source={require('@/assets/images/tunja.jpg')}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View pointerEvents="none" style={styles.heroOverlay} />
          <View pointerEvents="none" style={styles.heroFadeLayerOne} />
          <View pointerEvents="none" style={styles.heroFadeLayerTwo} />
          <View pointerEvents="none" style={styles.heroFadeLayerThree} />
          <View pointerEvents="none" style={styles.heroFadeLayerFour} />
          <View style={[styles.heroInner, isCompact && styles.heroInnerCompact]}>
            <View style={styles.locationPill}>
              <Icon name="location" color={colors.coral} size={18} />
              <Text style={styles.locationText}>TUNJA · BOYACÁ</Text>
            </View>
            <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>
              Muévete por la ciudad,{ '\n' }
              <Text style={styles.heroTitleBlue}>tan simple como{ '\n' }caminar el centro.</Text>
            </Text>
            <Text style={styles.heroDescription}>
              Consulta rutas de buses urbanos, encuentra el paradero más cercano y planifica{ '\n' }
              tu viaje con información clara y en tiempo real.
            </Text>

            <SearchBar
              destination={destination}
              isCompact={isCompact}
              onDestinationChange={setDestination}
            />
          </View>
        </ImageBackground>

        <View style={styles.exploreSection}>
          <View style={styles.mapSection}>
            <Text style={styles.sectionEyebrow}>DESCUBRE LA CIUDAD</Text>
            <Text style={styles.sectionTitle}>Planifica tu recorrido</Text>
            <Text style={styles.sectionDescription}>Consulta el trayecto, los paraderos y el tiempo estimado de llegada.</Text>
            <View style={[styles.mapRouteLayout, isCompact && styles.mapRouteLayoutCompact]}>
              <View style={styles.mapContainer}>
                <MapView />
              </View>
              <SelectedRouteCard isCompact={isCompact} />
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>MOVIDAS ESTA SEMANA</Text>
              <Text style={styles.sectionTitle}>Rutas más utilizadas</Text>
              <Text style={styles.sectionDescription}>Las líneas con mayor demanda en Tunja durante esta semana.</Text>
            </View>
            <Text style={styles.sectionLink}>Ver todas  ›</Text>
          </View>

          <View style={styles.routeGrid}>
            <RouteCard
              code="R-02"
              title="Centro – UPTC"
              description="Plaza de Bolívar → Universidad UPTC"
              duration="22 min"
              frequency="cada 6 min"
              stops="14 paradas"
              tone="blue"
            />
            <RouteCard
              code="R-07"
              title="Terminal – Norte"
              description="Terminal de Transportes → Barrio Los Muiscas"
              duration="31 min"
              frequency="cada 9 min"
              stops="19 paradas"
              tone="green"
            />
            <RouteCard
              code="R-11"
              title="Sur – Hospital"
              description="Villa Universitaria → Hospital San Rafael"
              duration="27 min"
              frequency="cada 12 min"
              stops="16 paradas"
              tone="gold"
            />
            <RouteCard
              code="R-15"
              title="Pozo de Donato"
              description="Plaza Real → Pozo de Donato"
              duration="18 min"
              frequency="cada 15 min"
              stops="11 paradas"
              tone="coral"
            />
          </View>

          <RouteInsights />
        </View>
      </ScrollView>
    </View>
  );
}
