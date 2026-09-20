import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Inicio' }} />
      <Stack.Screen name="routes/index" options={{ title: 'Rutas' }} />
      <Stack.Screen name="explore/index" options={{ title: 'Explorar' }} />
      <Stack.Screen name="favorites/index" options={{ title: 'Favoritos' }} />
      <Stack.Screen name="profile/index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="routes/search" options={{ title: 'Buscar ruta' }} />
      <Stack.Screen name="politica-de-privacidad/index" options={{ title: 'Política de Privacidad' }} />
      <Stack.Screen name="terminos-y-condiciones/index" options={{ title: 'Términos y Condiciones' }} />
    </Stack>
  );
}
