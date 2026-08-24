import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type SearchBarProps = Readonly<{
  destination: string;
  isCompact: boolean;
  onDestinationChange: (destination: string) => void;
  onUseCurrentLocation?: () => void;
}>;

export default function SearchBar({
  destination,
  isCompact,
  onDestinationChange,
  onUseCurrentLocation,
}: SearchBarProps) {
  const router = useRouter();

  const openSearch = () => {
    router.push({ pathname: '/routes/search', params: { destination } });
  };

  return (
    <View style={[styles.searchRow, isCompact && styles.searchRowCompact, isCompact && styles.searchRowPhone]}>
      <View style={[styles.searchBox, isCompact && styles.searchBoxCompact, isCompact && styles.searchBoxPhone]}>
        <Icon name="search" color={colors.muted} size={23} />
        <TextInput
          value={destination}
          onChangeText={onDestinationChange}
          onSubmitEditing={openSearch}
          placeholder="¿A dónde quieres ir?"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={[styles.searchInput, isCompact && styles.searchInputPhone]}
        />
        {!isCompact && <View style={styles.searchDivider} />}
        {!isCompact && (
          <Pressable onPress={onUseCurrentLocation} style={styles.locationAction}>
            <Icon name="gps" color={colors.blue} size={19} />
            <Text style={styles.locationActionText}>Mi ubicación</Text>
          </Pressable>
        )}
        <Pressable onPress={openSearch} style={[styles.searchButton, isCompact && styles.searchButtonPhone]}>
          <Text style={[styles.searchButtonText, isCompact && styles.searchButtonTextPhone]}>Buscar</Text>
          <Icon name="arrow" color={colors.white} size={17} />
        </Pressable>
      </View>

      {!isCompact && (
        <View style={styles.quickActions}>
          <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive]}>
            <Icon name="heart" color={colors.blue} size={19} />
            <Text style={styles.quickTextActive}>Favoritos</Text>
          </Pressable>
          <Pressable style={styles.quickPill}>
            <Icon name="history" color={colors.muted} size={18} />
            <Text style={styles.quickText}>Recientes</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/explore')} style={styles.quickPill}>
            <Icon name="bus" color={colors.muted} size={19} />
            <Text style={styles.quickText}>Todas las rutas</Text>
          </Pressable>
        </View>
      )}
      {isCompact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsPhone}
        >
          <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive, styles.quickPillPhone]}>
            <Icon name="heart" color={colors.blue} size={18} />
            <Text style={[styles.quickTextActive, styles.quickTextPhone]}>Favoritos</Text>
          </Pressable>
          <Pressable onPress={onUseCurrentLocation} style={[styles.quickPill, styles.quickPillPhone]}>
            <Icon name="gps" color={colors.ink} size={17} />
            <Text style={[styles.quickText, styles.quickTextPhone]}>Mi ubicación</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/explore')} style={[styles.quickPill, styles.quickPillPhone]}>
            <Icon name="bus" color={colors.ink} size={18} />
            <Text style={[styles.quickText, styles.quickTextPhone]}>Rutas</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
