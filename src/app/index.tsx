import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ComponentProps, useState } from 'react';
import {
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView from '@/components/Map/MapView';
import { colors, styles } from '@/styles/home.styles';

type SymbolName = NonNullable<ComponentProps<typeof SymbolView>['name']>;

function Icon({ name, color = colors.muted, size = 20 }: Readonly<{ name: SymbolName; color?: string; size?: number }>) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const [destination, setDestination] = useState('');

  const openSearch = () => {
    router.push({ pathname: '/routes/search', params: { destination } });
  };

  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={[styles.headerInner, isCompact && styles.headerInnerCompact]}>
          <Pressable onPress={() => router.push('/')} style={styles.brand}>
            <View style={styles.brandMark}>
              <Image
                source={require('@/assets/images/faviconT.png')}
                style={styles.brandLogo}
                accessibilityLabel="Logo de RutasTunja"
              />
            </View>
            <View>
              <Text style={styles.brandName}>
                Rutas<Text style={styles.brandAccent}>Tunja</Text>
              </Text>
              <Text style={styles.brandTagline}>MOVILIDAD URBANA</Text>
            </View>
          </Pressable>

          {!isCompact && (
            <View style={styles.nav}>
              <Pressable style={[styles.navItem, styles.navItemActive]}>
                <Text style={styles.navTextActive}>Rutas</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/explore')} style={styles.navItem}>
                <Text style={styles.navText}>Paraderos</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/routes/search')} style={styles.navItem}>
                <Text style={styles.navText}>Planificar</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/explore')} style={styles.navItem}>
                <Text style={styles.navText}>Ciudad</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.headerActions}>
            {!isCompact && (
              <View style={styles.serviceStatus}>
                <Icon name="chart.bar.fill" color={colors.green} size={17} />
                <Text style={styles.serviceText}>Servicio normal</Text>
              </View>
            )}
            <Pressable accessibilityLabel="Notificaciones" style={styles.iconButton}>
              <Icon name="bell" color={colors.muted} size={20} />
            </Pressable>
            <Pressable style={styles.loginButton}>
              <Text style={styles.loginText}>{isCompact ? 'Entrar' : 'Iniciar sesión'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <View style={styles.heroInner}>
            <View style={styles.locationPill}>
              <Icon name="mappin.and.ellipse" color={colors.coral} size={18} />
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

            <View style={[styles.searchRow, isCompact && styles.searchRowCompact]}>
              <View style={[styles.searchBox, isCompact && styles.searchBoxCompact]}>
                <Icon name="magnifyingglass" color={colors.muted} size={23} />
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  onSubmitEditing={openSearch}
                  placeholder="¿A dónde quieres ir?"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {!isCompact && <View style={styles.searchDivider} />}
                {!isCompact && (
                  <Pressable style={styles.locationAction}>
                    <Icon name="location.fill" color={colors.blue} size={19} />
                    <Text style={styles.locationActionText}>Mi ubicación</Text>
                  </Pressable>
                )}
                <Pressable onPress={openSearch} style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>Buscar</Text>
                  <Icon name="arrow.up.right" color={colors.white} size={17} />
                </Pressable>
              </View>

              {!isCompact && (
                <View style={styles.quickActions}>
                  <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive]}>
                    <Icon name="heart" color={colors.blue} size={19} />
                    <Text style={styles.quickTextActive}>Favoritos</Text>
                  </Pressable>
                  <Pressable style={styles.quickPill}>
                    <Icon name="clock.arrow.circlepath" color={colors.muted} size={18} />
                    <Text style={styles.quickText}>Recientes</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/explore')} style={styles.quickPill}>
                    <Icon name="bus" color={colors.muted} size={19} />
                    <Text style={styles.quickText}>Todas las rutas</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.belowFold}>
          <Text style={styles.sectionEyebrow}>LO QUE NECESITAS, MÁS CERCA</Text>
          <Text style={styles.sectionTitle}>Explora Tunja a tu ritmo</Text>
          <View style={styles.mapContainer}>
            <MapView />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
