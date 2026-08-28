import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type HeaderProps = Readonly<{
  isCompact: boolean;
}>;

function NotificationContent({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <>
      <View style={styles.notificationPopoverHeader}>
        <Text style={styles.notificationPopoverTitle}>Notificaciones</Text>
        <Pressable accessibilityLabel="Cerrar notificaciones" onPress={onClose} style={styles.notificationClose}>
          <Icon name="close" color={colors.muted} size={17} />
        </Pressable>
      </View>
      <View style={styles.notificationEmptyIcon}>
        <Icon name="notification" color={colors.blue} size={22} />
      </View>
      <Text style={styles.notificationEmptyTitle}>Sin notificaciones</Text>
      <Text style={styles.notificationEmptyText}>No hay reportes nuevos por ahora.</Text>
    </>
  );
}

export default function Header({ isCompact }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Rutas', href: '/routes' as never },
    { label: 'Turismo', href: '/explore' },
    { label: 'Favoritos', href: '/favorites' },
  ] as const;

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
          {navItems.map((item) => {
            const isActive = item.label === 'Rutas' ? pathname.startsWith('/routes') : pathname === item.href;

            return (
              <Pressable key={item.href} onPress={() => router.push(item.href)} style={[styles.navItem, isActive && styles.navItemActive]}>
                <Text style={isActive ? styles.navTextActive : styles.navText}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.headerActions}>
        <View style={styles.notificationAnchor}>
          <Pressable
            accessibilityLabel="Notificaciones"
            accessibilityState={{ expanded: isNotificationsOpen }}
            onPress={() => setIsNotificationsOpen((open) => !open)}
            style={[styles.iconButton, isCompact && styles.iconButtonPhone]}
          >
            <Icon name="notification" color={colors.muted} size={20} />
          </Pressable>
          {!isCompact && isNotificationsOpen && <View style={styles.notificationPopover}><NotificationContent onClose={() => setIsNotificationsOpen(false)} /></View>}
        </View>
        {isCompact && (
          <Pressable
            accessibilityLabel="Abrir navegación"
            accessibilityState={{ expanded: isMenuOpen }}
            onPress={() => setIsMenuOpen((open) => !open)}
            style={[styles.iconButton, styles.iconButtonPhone]}
          >
            <Icon name="menu" color={colors.muted} size={23} />
          </Pressable>
        )}
        <Pressable style={[styles.loginButton, isCompact && styles.loginButtonPhone]}>
          <Text style={[styles.loginText, isCompact && styles.loginTextPhone]}>{isCompact ? 'Entrar' : 'Iniciar sesión'}</Text>
        </Pressable>
      </View>
      <Modal transparent visible={isCompact && isMenuOpen} animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <Pressable style={styles.mobileNavBackdrop} onPress={() => setIsMenuOpen(false)}>
          <Pressable style={styles.mobileNavMenu} onPress={(event) => event.stopPropagation()}>
            {navItems.map((item) => {
              const isActive = item.label === 'Rutas' ? pathname.startsWith('/routes') : pathname === item.href;
              return <Pressable key={item.href} onPress={() => { setIsMenuOpen(false); router.push(item.href); }} style={[styles.mobileNavItem, isActive && styles.mobileNavItemActive]}><Text style={isActive ? styles.mobileNavTextActive : styles.mobileNavText}>{item.label}</Text></Pressable>;
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal transparent visible={isCompact && isNotificationsOpen} animationType="fade" onRequestClose={() => setIsNotificationsOpen(false)}>
        <Pressable style={styles.mobileNavBackdrop} onPress={() => setIsNotificationsOpen(false)}>
          <Pressable style={styles.notificationPopoverPhone} onPress={(event) => event.stopPropagation()}>
            <NotificationContent onClose={() => setIsNotificationsOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
