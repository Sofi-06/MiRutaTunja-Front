import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import Icon from '@/components/ui/Icon';

const items = [
  { label: 'Inicio', href: '/', icon: 'home' as const },
  { label: 'Rutas', href: '/routes' as never, icon: 'route' as const },
  { label: 'Favoritos', href: '/favorites', icon: 'heart' as const },
  { label: 'Turismo', href: '/explore', icon: 'location' as const },
  { label: 'RutaBot', icon: 'chatbot' as const },
];

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return <View style={styles.nav}>
    {items.map((item) => {
      const active = item.label === 'Rutas' ? pathname.startsWith('/routes') : pathname === item.href;
      const handlePress = () => item.label === 'RutaBot'
        ? Alert.alert('RutaBot', 'Muy pronto podrás consultar rutas, paraderos y tarifas con el asistente virtual.')
        : router.push(item.href as never);
      return <Pressable key={item.label} onPress={handlePress} style={styles.item}><Icon name={item.icon} color={active ? '#3f719b' : '#728092'} size={23} /><Text style={active ? styles.activeText : styles.text}>{item.label}</Text></Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  nav: { height: 70, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e3ebf0', paddingTop: 6 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  text: { color: '#728092', fontSize: 11, fontWeight: '600' },
  activeText: { color: '#3f719b', fontSize: 11, fontWeight: '800' },
});
