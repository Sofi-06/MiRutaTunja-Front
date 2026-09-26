import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
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
  showQuickActions?: boolean;
  isLoadingOrigin?: boolean;
  onUseCurrentLocation?: () => void;
  onSearchBoth?: (origin: string, destination: string) => void;
  onStartPickOrigin?: () => void;
  onStartPickDestination?: () => void;
}>;

export default function SearchBar({
  origin,
  onOriginChange,
  onOriginSelect,
  destination,
  onDestinationChange,
  onDestinationSelect,
  isCompact,
  showQuickActions = true,
  isLoadingOrigin = false,
  onUseCurrentLocation,
  onSearchBoth,
  onStartPickOrigin,
  onStartPickDestination,
}: SearchBarProps) {
  const router = useRouter();

  // Estados locales independientes para evitar pérdida de foco o saltos al escribir
  const [localOrigin, setLocalOrigin] = useState(origin);
  const [localDestination, setLocalDestination] = useState(destination);
  const [focusedField, setFocusedField] = useState<'origin' | 'destination' | null>(null);

  // Refs (no estado) que marcan si el usuario editó el campo después de la última
  // sincronización con las props externas. A diferencia de `focusedField`, no dependen
  // del orden exacto de los eventos onBlur/onPress del navegador: onBlur se dispara
  // antes que el onPress de una sugerencia o de "Calcular Ruta", así que depender solo
  // del foco dejaba una ventana en la que una prop nueva podía pisar lo que el usuario
  // acababa de escribir o seleccionar.
  const userEditedOriginRef = useRef(false);
  const userEditedDestinationRef = useRef(false);

  // Sincronizar desde propiedades externas solo si el usuario no dejó una edición pendiente
  useEffect(() => {
    if (!userEditedOriginRef.current && origin !== localOrigin) {
      setLocalOrigin(origin);
    }
  }, [origin, localOrigin]);

  useEffect(() => {
    if (!userEditedDestinationRef.current && destination !== localDestination) {
      setLocalDestination(destination);
    }
  }, [destination, localDestination]);

  // Estados para autocompletado
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const timeoutRef = useRef<any>(null);
  // Recuerda el último texto por el que ya se pidieron sugerencias, para no
  // relanzar la búsqueda de red al simple reenfocar un campo sin cambios.
  const lastSearchedOriginRef = useRef<string>('');
  const lastSearchedDestinationRef = useRef<string>('');

  const handleTextChange = (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setLocalOrigin(text);
      userEditedOriginRef.current = true;
      onOriginChange(text);
    } else {
      setLocalDestination(text);
      userEditedDestinationRef.current = true;
      onDestinationChange(text);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      setActiveField(null);
      setIsLoadingSuggestions(false);
      return;
    }

    setActiveField(field);
    setIsLoadingSuggestions(true);

    timeoutRef.current = setTimeout(async () => {
      console.log(`SearchBar: Debounce triggered for ${field}: "${text}"`);
      const results = await searchPlaces(text);
      if (field === 'origin') {
        lastSearchedOriginRef.current = text;
      } else {
        lastSearchedDestinationRef.current = text;
      }
      setSuggestions(results.filter((place): place is PlaceResult => Boolean(place?.name && Number.isFinite(place.lat) && Number.isFinite(place.lng))));
      setIsLoadingSuggestions(false);
    }, 350);
  };

  const handleSelectSuggestion = (place: PlaceResult) => {
    if (activeField === 'origin') {
      setLocalOrigin(place.name);
      userEditedOriginRef.current = false;
      onOriginChange(place.name);
      if (onOriginSelect) {
        onOriginSelect(place.name, { lat: place.lat, lng: place.lng });
      }
    } else if (activeField === 'destination') {
      setLocalDestination(place.name);
      userEditedDestinationRef.current = false;
      onDestinationChange(place.name);
      if (onDestinationSelect) {
        onDestinationSelect(place.name, { lat: place.lat, lng: place.lng });
      }
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleUseCurrentLocationPress = () => {
    userEditedOriginRef.current = false;
    setLocalOrigin('Mi ubicación actual');
    onOriginChange('Mi ubicación actual');
    setSuggestions([]);
    setActiveField(null);
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
    }
  };

  return (
    <View style={[styles.searchRow, isCompact && styles.searchRowCompact, isCompact && styles.searchRowPhone, { width: '100%' }]}>
      <View style={[styles.searchBox, { flexDirection: 'column', gap: 10, padding: 14, width: '100%', borderRadius: 16, marginTop: showQuickActions && !isCompact ? 66 : 0 }, isCompact && styles.searchBoxCompact, isCompact && styles.searchBoxPhone]}>
        <View style={[styles.searchFields, !isCompact && styles.searchFieldsInline]}>
          {/* Fila del Origen */}
          <View style={[styles.searchFieldRow, !isCompact && styles.searchFieldRowInline, { flex: 1, minWidth: isCompact ? '100%' : 260 }]}>
            <Icon name="pin" color={colors.blue} size={20} />
            {isLoadingOrigin && !localOrigin ? (
              <View style={{ flex: 1, height: 40, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }}>
                <Skeleton width="55%" height={14} borderRadius={4} />
              </View>
            ) : (
              <TextInput
                value={localOrigin}
                onChangeText={(txt) => handleTextChange(txt, 'origin')}
                onFocus={() => {
                  setFocusedField('origin');
                  if (localOrigin.trim()) {
                    if (localOrigin === lastSearchedOriginRef.current) {
                      setActiveField('origin');
                    } else {
                      handleTextChange(localOrigin, 'origin');
                    }
                  }
                }}
                onBlur={() => {
                  setFocusedField(null);
                }}
                onSubmitEditing={() => {
                  userEditedOriginRef.current = false;
                  userEditedDestinationRef.current = false;
                  if (onSearchBoth) onSearchBoth(localOrigin, localDestination);
                }}
                placeholder="¿De dónde sales? (ej: UPTC, Plaza de Bolívar...)"
                placeholderTextColor={colors.muted}
                style={{ 
                  flex: 1, 
                  minWidth: 0,
                  height: 40,
                  fontSize: 14,
                  color: colors.ink,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 8,
                  paddingHorizontal: 12
                }}
              />
            )}
          </View>

          {/* Fila del Destino */}
          <View style={[styles.searchFieldRow, !isCompact && styles.searchFieldRowInline, { flex: 1, minWidth: isCompact ? '100%' : 260 }]}>
            <Icon name="target" color={colors.coral} size={20} />
            <TextInput
              value={localDestination}
              onChangeText={(txt) => handleTextChange(txt, 'destination')}
              onFocus={() => {
                setFocusedField('destination');
                if (localDestination.trim()) {
                  if (localDestination === lastSearchedDestinationRef.current) {
                    setActiveField('destination');
                  } else {
                    handleTextChange(localDestination, 'destination');
                  }
                }
              }}
              onBlur={() => {
                setFocusedField(null);
              }}
              onSubmitEditing={() => {
                userEditedOriginRef.current = false;
                userEditedDestinationRef.current = false;
                if (onSearchBoth) onSearchBoth(localOrigin, localDestination);
              }}
              placeholder="¿A dónde quieres ir? (ej: Terminal, Hospital...)"
              placeholderTextColor={colors.muted}
              style={{ 
                flex: 1, 
                minWidth: 0,
                height: 40,
                fontSize: 14,
                color: colors.ink,
                backgroundColor: '#f1f5f9',
                borderRadius: 8,
                paddingHorizontal: 12
              }}
            />
          </View>
        </View>

        {/* Sugerencias de Autocompletado */}
        {activeField && (isLoadingSuggestions || suggestions.length > 0) && (
          <View style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderLeftWidth: 4,
            borderLeftColor: activeField === 'origin' ? colors.blue : colors.coral,
            shadowColor: '#17283b',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            marginTop: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: activeField === 'origin' ? colors.blue : colors.coral, letterSpacing: 0.5 }}>
                {activeField === 'origin' ? '📍 SUGERENCIAS DE ORIGEN' : '🎯 SUGERENCIAS DE DESTINO'}
              </Text>
              <Pressable onPress={() => { setSuggestions([]); setActiveField(null); setIsLoadingSuggestions(false); }} hitSlop={8}>
                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '700' }}>Cerrar ✕</Text>
              </Pressable>
            </View>

            {isLoadingSuggestions ? (
              <View style={{ paddingVertical: 4, gap: 8 }}>
                {[1, 2, 3].map((key) => (
                  <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 6 }}>
                    <Skeleton width={18} height={18} borderRadius={9} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="65%" height={14} borderRadius={4} />
                      <Skeleton width="40%" height={10} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              suggestions.slice(0, 4).map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelectSuggestion(item)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 9,
                    paddingHorizontal: 6,
                    backgroundColor: pressed ? '#f8fafc' : 'transparent',
                    borderRadius: 8,
                    borderBottomWidth: index < Math.min(suggestions.length, 4) - 1 ? 1 : 0,
                    borderBottomColor: '#f1f5f9'
                  })}
                >
                  <Icon name={activeField === 'origin' ? 'pin' : 'target'} color={activeField === 'origin' ? colors.blue : colors.coral} size={16} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{item.name}</Text>
                    {item.address && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }} numberOfLines={1}>{item.address}</Text>}
                  </View>
                  <Icon name="chevron" color={colors.muted} size={14} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Acciones */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 2 }}>
          <Pressable
            onPress={handleUseCurrentLocationPress}
            style={styles.searchLocationAction}
          >
            <Icon name="gps" color={colors.blue} size={17} />
            <Text style={styles.searchLocationActionText}>Usar mi ubicación</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              userEditedOriginRef.current = false;
              userEditedDestinationRef.current = false;
              onSearchBoth && onSearchBoth(localOrigin, localDestination);
            }}
            style={[styles.searchButton, { position: 'relative', right: 0, height: 38, paddingHorizontal: 14 }]}
          >
            <Text style={styles.searchButtonText}>Calcular Ruta</Text>
            <Icon name="arrow" color={colors.white} size={15} />
          </Pressable>
        </View>
      </View>

      {showQuickActions && !isCompact && (
        <View style={styles.quickActions}>
          <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive]}>
            <Icon name="heart" color={colors.blue} size={19} />
            <Text style={styles.quickTextActive}>Favoritos</Text>
          </Pressable>
          <Pressable style={styles.quickPill}>
            <Icon name="history" color={colors.muted} size={18} />
            <Text style={styles.quickText}>Recientes</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/routes' as never)} style={styles.quickPill}>
            <Icon name="bus" color={colors.muted} size={19} />
            <Text style={styles.quickText}>Todas las rutas</Text>
          </Pressable>
        </View>
      )}
      {showQuickActions && isCompact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsPhone}
        >
          <Pressable onPress={() => router.push('/favorites')} style={[styles.quickPill, styles.quickPillActive, styles.quickPillPhone]}>
            <Icon name="heart" color={colors.blue} size={18} />
            <Text style={[styles.quickTextActive, styles.quickTextPhone]}>Favoritos</Text>
          </Pressable>
          <Pressable onPress={handleUseCurrentLocationPress} style={[styles.quickPill, styles.quickPillPhone]}>
            <Icon name="gps" color={colors.ink} size={17} />
            <Text style={[styles.quickText, styles.quickTextPhone]}>Mi ubicación</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/routes' as never)} style={[styles.quickPill, styles.quickPillPhone]}>
            <Icon name="bus" color={colors.ink} size={18} />
            <Text style={[styles.quickText, styles.quickTextPhone]}>Rutas</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
