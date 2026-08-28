import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { getRecentSearches, RecentSearch } from '@/services/localData';

type HistoryModalProps = Readonly<{
  visible: boolean;
  onClose: () => void;
}>;

const formatDate = (createdAt: number) => new Date(createdAt).toLocaleString('es-CO', {
  day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit',
});

export default function HistoryModal({ visible, onClose }: HistoryModalProps) {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    if (visible) {
      void getRecentSearches().then(setSearches);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleRow}><Icon name="history" color="#3f719b" size={21} /><Text style={styles.title}>Últimas consultas</Text></View>
            <Pressable accessibilityLabel="Cerrar historial" onPress={onClose} style={styles.close}><Icon name="close" color="#728092" size={18} /></Pressable>
          </View>
          {searches.length === 0 ? <Text style={styles.empty}>Aún no has realizado consultas.</Text> : searches.map((search) => (
            <View key={`${search.origin}-${search.destination}-${search.createdAt}`} style={styles.item}>
              <Text style={styles.route} numberOfLines={1}>{search.origin} <Text style={styles.arrow}>›</Text> {search.destination}</Text>
              <Text style={styles.date}>{formatDate(search.createdAt)}</Text>
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-start', paddingTop: 82, paddingHorizontal: 20, backgroundColor: 'rgba(23, 40, 59, 0.28)' },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, shadowColor: '#17283b', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#17283b', fontSize: 18, fontWeight: '800' },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f7fa' },
  empty: { color: '#728092', fontSize: 14, lineHeight: 20, paddingVertical: 16, textAlign: 'center' },
  item: { paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#edf2f5' },
  route: { color: '#17283b', fontSize: 14, fontWeight: '700' },
  arrow: { color: '#3f719b', fontSize: 20 },
  date: { color: '#728092', fontSize: 12, marginTop: 4 },
});
