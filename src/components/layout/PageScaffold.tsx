import { type ReactNode, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/components/header/Header';
import HistoryModal from '@/components/history/HistoryModal';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Icon from '@/components/ui/Icon';
import { colors } from '@/styles/home.styles';

type PageScaffoldProps = Readonly<{ children: ReactNode }>;

function NativeMobileHeader() {
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <View style={styles.nativeHeaderInner}>
      <Pressable onPress={() => router.push('/')} style={styles.nativeBrand}>
        <View style={styles.nativeLogoShell}>
          <Image source={require('@/assets/images/faviconT.png')} style={styles.nativeLogo} />
        </View>
        <View>
          <Text style={styles.nativeBrandName}>Rutas<Text style={styles.nativeBrandAccent}>Tunja</Text></Text>
          <Text style={styles.nativeTagline}>MOVILIDAD URBANA</Text>
        </View>
      </Pressable>
      <View style={styles.nativeHeaderActions}>
        <Pressable accessibilityLabel="Historial de viajes" onPress={() => setIsHistoryOpen(true)} style={styles.nativeHeaderButton}>
          <Icon name="history" color="#385b77" size={21} />
        </Pressable>
        <Pressable accessibilityLabel="Notificaciones" onPress={() => Alert.alert('Notificaciones', 'No hay reportes nuevos por ahora.')} style={styles.nativeHeaderButton}>
          <Icon name="notification" color="#385b77" size={22} />
        </Pressable>
      </View>
      <HistoryModal visible={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </View>
  );
}

export default function PageScaffold({ children }: PageScaffoldProps) {
  const { width } = useWindowDimensions();
  const isNative = Platform.OS !== 'web';

  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top']} style={styles.header}>
        {isNative ? <NativeMobileHeader /> : <Header isCompact={width < 760} />}
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {isNative && <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}><MobileBottomNav /></SafeAreaView>}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f2f7fa' },
  header: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  scrollContent: { flexGrow: 1, paddingBottom: 18 },
  bottomSafeArea: { backgroundColor: '#fff' },
  nativeHeaderInner: { minHeight: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nativeBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nativeLogoShell: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6fbfe', borderRadius: 15 },
  nativeLogo: { width: 37, height: 37 },
  nativeBrandName: { color: '#17283b', fontSize: 19, fontWeight: '800' },
  nativeBrandAccent: { color: '#3f719b' },
  nativeTagline: { color: '#687789', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 2 },
  nativeHeaderActions: { flexDirection: 'row', gap: 8 },
  nativeHeaderButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#f8fbfd', borderWidth: 1, borderColor: '#e5edf2' },
});
