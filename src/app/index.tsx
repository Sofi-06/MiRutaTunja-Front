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
import Footer from '@/components/footer/Footer';
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
          style={[styles.hero, isCompact && styles.heroPhone]}
          imageStyle={[styles.heroImage, isCompact && styles.heroImagePhone]}
        >
          <View pointerEvents="none" style={styles.heroOverlay} />
          <View pointerEvents="none" style={[styles.heroFadeLayerOne, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerTwo, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerThree, isCompact && styles.heroFadePhone]} />
          <View pointerEvents="none" style={[styles.heroFadeLayerFour, isCompact && styles.heroFadePhone]} />
          <View style={[styles.heroInner, isCompact && styles.heroInnerCompact, isCompact && styles.heroInnerPhone]}>
            <View style={[styles.locationPill, isCompact && styles.locationPillPhone]}>
              <Icon name="location" color={colors.coral} size={18} />
              <Text style={[styles.locationText, isCompact && styles.locationTextPhone]}>TUNJA · BOYACÁ</Text>
            </View>
            <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact, isCompact && styles.heroTitlePhone]}>
              Muévete por la ciudad,{ '\n' }
              <Text style={styles.heroTitleBlue}>tan simple como{ '\n' }caminar el centro.</Text>
            </Text>
            <Text style={[styles.heroDescription, isCompact && styles.heroDescriptionPhone]}>
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

        <View style={[styles.exploreSection, isCompact && styles.exploreSectionPhone]}>
          <View style={styles.mapSection}>
            <Text style={styles.sectionEyebrow}>DESCUBRE LA CIUDAD</Text>
            <Text style={[styles.sectionTitle, isCompact && styles.sectionTitlePhone]}>Planifica tu recorrido</Text>
            <Text style={[styles.sectionDescription, isCompact && styles.sectionDescriptionPhone]}>Consulta el trayecto, los paraderos y el tiempo estimado de llegada.</Text>
            <View style={[styles.mapRouteLayout, isCompact && styles.mapRouteLayoutCompact]}>
              <View style={[styles.mapContainer, isCompact && styles.mapContainerPhone]}>
                <MapView />
              </View>
              <SelectedRouteCard isCompact={isCompact} />
            </View>
          </View>

          <View style={[styles.sectionHeaderRow, isCompact && styles.sectionHeaderRowPhone]}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>MOVIDAS ESTA SEMANA</Text>
              <Text style={[styles.sectionTitle, isCompact && styles.sectionTitlePhone]}>Rutas más utilizadas</Text>
              <Text style={[styles.sectionDescription, isCompact && styles.sectionDescriptionPhone]}>Las líneas con mayor demanda en Tunja durante esta semana.</Text>
            </View>
            {!isCompact && <Text style={styles.sectionLink}>Ver todas  ›</Text>}
          </View>

          <View style={[styles.routeGrid, isCompact && styles.routeGridPhone]}>
            <RouteCard
              code="R-02"
              title="Centro – UPTC"
              description="Plaza de Bolívar → Universidad UPTC"
              duration="22 min"
              frequency="cada 6 min"
              stops="14 paradas"
              tone="blue"
              isCompact={isCompact}
            />
            <RouteCard
              code="R-07"
              title="Terminal – Norte"
              description="Terminal de Transportes → Barrio Los Muiscas"
              duration="31 min"
              frequency="cada 9 min"
              stops="19 paradas"
              tone="green"
              isCompact={isCompact}
            />
            <RouteCard
              code="R-11"
              title="Sur – Hospital"
              description="Villa Universitaria → Hospital San Rafael"
              duration="27 min"
              frequency="cada 12 min"
              stops="16 paradas"
              tone="gold"
              isCompact={isCompact}
            />
            <RouteCard
              code="R-15"
              title="Pozo de Donato"
              description="Plaza Real → Pozo de Donato"
              duration="18 min"
              frequency="cada 15 min"
              stops="11 paradas"
              tone="coral"
              isCompact={isCompact}
            />
          </View>

          {isCompact && <Text style={[styles.sectionLink, styles.sectionLinkBelowPhone]}>Ver todas las rutas  ›</Text>}

          <RouteInsights isCompact={isCompact} />
        </View>

        <Footer isCompact={isCompact} />
      </ScrollView>
    </View>
  );
}
