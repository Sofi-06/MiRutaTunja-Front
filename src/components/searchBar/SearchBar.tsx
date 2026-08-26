import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';
import { searchPlaces, PlaceResult } from '@/services/placesService';

type SearchBarProps = Readonly<{
  origin: string;
  onOriginChange: (origin: string) => void;
  onOriginSelect?: (name: string, coords: { lat: number; lng: number }) => void;
  destination: string;
  onDestinationChange: (destination: string) => void;
  onDestinationSelect?: (name: string, coords: { lat: number; lng: number }) => void;
  isCompact: boolean;
  onUseCurrentLocation?: () => void;
  onSearchBoth?: (origin: string, destination: string) => void;
}>;

export default function SearchBar({
  origin,
  onOriginChange,
  onOriginSelect,
  destination,
  onDestinationChange,
  onDestinationSelect,
  isCompact,
  onUseCurrentLocation,
  onSearchBoth,
}: SearchBarProps) {
  const router = useRouter();

  // Estados para autocompletado
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const timeoutRef = useRef<any>(null);

  const handleTextChange = (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      onOriginChange(text);
    } else {
      onDestinationChange(text);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      setActiveField(null);
      return;
    }

    setActiveField(field);

    timeoutRef.current = setTimeout(async () => {
      console.log(`SearchBar: Debounce triggered for ${field}: "${text}"`);
      const results = await searchPlaces(text);
      setSuggestions(results);
    }, 400); // Debounce de 400ms
  };

  const handleSelectSuggestion = (place: PlaceResult) => {
    if (activeField === 'origin') {
      onOriginChange(place.name);
      if (onOriginSelect) {
        onOriginSelect(place.name, { lat: place.lat, lng: place.lng });
      }
    } else if (activeField === 'destination') {
      onDestinationChange(place.name);
      if (onDestinationSelect) {
        onDestinationSelect(place.name, { lat: place.lat, lng: place.lng });
      }
    }
    setSuggestions([]);
    setActiveField(null);
  };

  return (
    <View style={[styles.searchRow, isCompact && styles.searchRowCompact, isCompact && styles.searchRowPhone, { width: '100%' }]}>
      <View style={[styles.searchBox, { flexDirection: 'column', gap: 10, padding: 14, width: '100%', borderRadius: 16 }, isCompact && styles.searchBoxCompact, isCompact && styles.searchBoxPhone]}>
        
        {/* Fila del Origen */}
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
          <Icon name="pin" color={colors.blue} size={20} />
          <TextInput
            value={origin}
            onChangeText={(txt) => handleTextChange(txt, 'origin')}
            placeholder="¿De dónde sales? (ej: UPTC, Plaza de Bolívar...)"
            placeholderTextColor={colors.muted}
            style={{ 
              flex: 1, 
              height: 40,
              fontSize: 14,
              color: colors.ink,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              paddingHorizontal: 12
            }}
          />
        </View>

        {/* Sugerencias de Origen */}
        {activeField === 'origin' && suggestions.length > 0 && (
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 4, borderLeftWidth: 3, borderLeftColor: colors.blue, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            {suggestions.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelectSuggestion(item)}
                style={({ pressed }) => ({
                  padding: 10,
                  backgroundColor: pressed ? '#f8fafc' : 'transparent',
                  borderRadius: 6,
                  borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9'
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{item.name}</Text>
                {item.address && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{item.address}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* Fila del Destino */}
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
          <Icon name="target" color={colors.coral} size={20} />
          <TextInput
            value={destination}
            onChangeText={(txt) => handleTextChange(txt, 'destination')}
            placeholder="¿A dónde quieres ir? (ej: Terminal, Hospital...)"
            placeholderTextColor={colors.muted}
            style={{ 
              flex: 1, 
              height: 40,
              fontSize: 14,
              color: colors.ink,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              paddingHorizontal: 12
            }}
          />
        </View>

        {/* Sugerencias de Destino */}
        {activeField === 'destination' && suggestions.length > 0 && (
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 4, borderLeftWidth: 3, borderLeftColor: colors.coral, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            {suggestions.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelectSuggestion(item)}
                style={({ pressed }) => ({
                  padding: 10,
                  backgroundColor: pressed ? '#f8fafc' : 'transparent',
                  borderRadius: 6,
                  borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9'
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{item.name}</Text>
                {item.address && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{item.address}</Text>}
              </Pressable>
            ))}
          </View>
        )}

        {/* Acciones */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 }}>
          <Pressable 
            onPress={onUseCurrentLocation} 
            style={({ hovered }) => [
              { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: hovered ? '#eff6ff' : 'transparent' }
            ]}
          >
            <Icon name="gps" color={colors.blue} size={17} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.blue }}>Usar mi ubicación</Text>
          </Pressable>

          <Pressable 
            onPress={() => onSearchBoth && onSearchBoth(origin, destination)} 
            style={[styles.searchButton, { position: 'relative', right: 0, height: 38, paddingHorizontal: 14 }]}
          >
            <Text style={styles.searchButtonText}>Calcular Ruta</Text>
            <Icon name="arrow" color={colors.white} size={15} />
          </Pressable>
        </View>
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
