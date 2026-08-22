import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type HeaderProps = Readonly<{
  isCompact: boolean;
}>;

export default function Header({ isCompact }: HeaderProps) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <View style={[styles.headerInner, isCompact && styles.headerInnerCompact, isCompact && styles.headerInnerPhone]}>
      <Pressable onPress={() => router.push('/')} style={[styles.brand, isCompact && styles.brandPhone]}>
        <View style={[styles.brandMark, isCompact && styles.brandMarkPhone]}>
          <Image
            source={require('@/assets/images/faviconT.png')}
            style={[styles.brandLogo, isCompact && styles.brandLogoPhone]}
            accessibilityLabel="Logo de RutasTunja"
          />
        </View>
        <View>
          <Text style={[styles.brandName, isCompact && styles.brandNamePhone]}>
            Rutas<Text style={styles.brandAccent}>Tunja</Text>
          </Text>
          <Text style={[styles.brandTagline, isCompact && styles.brandTaglinePhone]}>MOVILIDAD URBANA</Text>
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
            <Icon name="service" color={colors.green} size={17} />
            <Text style={styles.serviceText}>Servicio normal</Text>
          </View>
        )}
        <View style={styles.notificationAnchor}>
          <Pressable
            accessibilityLabel="Notificaciones"
            accessibilityState={{ expanded: isNotificationsOpen }}
            onPress={() => setIsNotificationsOpen((open) => !open)}
            style={[styles.iconButton, isCompact && styles.iconButtonPhone]}
          >
            <Icon name="notification" color={colors.muted} size={20} />
          </Pressable>
          {isNotificationsOpen && (
            <View style={[styles.notificationPopover, isCompact && styles.notificationPopoverCompact]}>
              <View style={styles.notificationPopoverHeader}>
                <Text style={styles.notificationPopoverTitle}>Notificaciones</Text>
                <Pressable
                  accessibilityLabel="Cerrar notificaciones"
                  onPress={() => setIsNotificationsOpen(false)}
                  style={styles.notificationClose}
                >
                  <Icon name="close" color={colors.muted} size={17} />
                </Pressable>
              </View>
              <View style={styles.notificationEmptyIcon}>
                <Icon name="notification" color={colors.blue} size={22} />
              </View>
              <Text style={styles.notificationEmptyTitle}>Sin notificaciones</Text>
              <Text style={styles.notificationEmptyText}>No hay reportes nuevos por ahora.</Text>
            </View>
          )}
        </View>
        <Pressable style={[styles.loginButton, isCompact && styles.loginButtonPhone]}>
          <Text style={[styles.loginText, isCompact && styles.loginTextPhone]}>{isCompact ? 'Entrar' : 'Iniciar sesión'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
