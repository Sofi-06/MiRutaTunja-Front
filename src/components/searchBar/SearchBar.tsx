import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type SearchBarProps = Readonly<{
  destination: string;
  isCompact: boolean;
  onDestinationChange: (destination: string) => void;
}>;

export default function SearchBar({ destination, isCompact, onDestinationChange }: SearchBarProps) {
  const router = useRouter();

  const openSearch = () => {
    router.push({ pathname: '/routes/search', params: { destination } });
  };

  return (
    <View style={[styles.searchRow, isCompact && styles.searchRowCompact]}>
      <View style={[styles.searchBox, isCompact && styles.searchBoxCompact]}>
        <Icon name="search" color={colors.muted} size={23} />
        <TextInput
          value={destination}
          onChangeText={onDestinationChange}
          onSubmitEditing={openSearch}
          placeholder="¿A dónde quieres ir?"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {!isCompact && <View style={styles.searchDivider} />}
        {!isCompact && (
          <Pressable style={styles.locationAction}>
            <Icon name="gps" color={colors.blue} size={19} />
            <Text style={styles.locationActionText}>Mi ubicación</Text>
          </Pressable>
        )}
        <Pressable onPress={openSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
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
    </View>
  );
}
