import { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@/components/ui/Icon';
import routesMetadata from '@/assets/routes/routes-metadata.json';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Map metadata object to an array for rendering
  const routesList = Object.keys(routesMetadata).map((key) => {
    const item = routesMetadata[key as keyof typeof routesMetadata];
    // Convert R1 to R-01 or R10 to R-10 format for display
    const num = key.replace('R', '');
    const displayCode = `R-${num.padStart(2, '0')}`;
    return {
      key,
      displayCode,
      ...item,
    };
  });

  // Filter routes based on search query
  const filteredRoutes = routesList.filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.displayCode.toLowerCase().includes(query) ||
      route.name.toLowerCase().includes(query) ||
      route.category.toLowerCase().includes(query)
    );
  });

  const handleSelectRoute = (code: string) => {
    // Redirect to home and pass routeCode
    router.push({
      pathname: '/',
      params: { routeCode: code },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="back" color="#1e293b" size={20} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
        <Text style={styles.title}>Todas las Rutas</Text>
        <Text style={styles.subtitle}>
          Explora y selecciona cualquiera de las 26 rutas urbanas de Tunja para verlas en el mapa.
        </Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Buscar por número o nombre de calle (ej. UPTC, R-02)..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          // Assign dynamic tones based on index
          const tones = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
          const toneColor = tones[index % tones.length];

          return (
            <Pressable
              onPress={() => handleSelectRoute(item.displayCode)}
              style={({ hovered }: any) => [
                styles.card,
                hovered && styles.cardHovered,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.codeBadge, { backgroundColor: toneColor + '15' }]}>
                  <Text style={[styles.codeText, { color: toneColor }]}>
                    {item.displayCode}
                  </Text>
                </View>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>

              <Text style={styles.routeName}>{item.name}</Text>

              <View style={styles.divider} />

              <View style={styles.scheduleRow}>
                <View style={styles.scheduleDetail}>
                  <Text style={styles.scheduleLabel}>Lunes a Sábado</Text>
                  <Text style={styles.scheduleValue}>
                    {item.schedule.weekdays.hours} | cada {item.schedule.weekdays.frequency}
                  </Text>
                </View>

                {item.schedule.sundaysAndHolidays.hours !== '--' && (
                  <View style={styles.scheduleDetail}>
                    <Text style={styles.scheduleLabel}>Dom y Festivos</Text>
                    <Text style={styles.scheduleValue}>
                      {item.schedule.sundaysAndHolidays.hours} | cada {item.schedule.sundaysAndHolidays.frequency}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                <Text style={[styles.actionText, { color: toneColor }]}>
                  Ver en el mapa ›
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  searchBox: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHovered: {
    borderColor: '#cbd5e1',
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.08,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  scheduleRow: {
    gap: 8,
    marginBottom: 12,
  },
  scheduleDetail: {
    flexDirection: 'column',
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 12,
    color: '#334155',
  },
  actionRow: {
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
