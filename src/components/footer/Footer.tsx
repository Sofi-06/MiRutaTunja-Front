import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { footerStyles as styles } from '@/styles/footer.styles';

type FooterProps = Readonly<{
  isCompact?: boolean;
  internal?: boolean;
}>;

export default function Footer({ isCompact = false, internal = false }: FooterProps) {
  const router = useRouter();

  const links = [
    { label: 'Inicio', route: '/', icon: 'home' as const },
    { label: 'Rutas', route: '/routes', icon: 'route' as const },
    { label: 'Explorar', route: '/explore', icon: 'target' as const },
    { label: 'Favoritos', route: '/favorites', icon: 'heart' as const },
  ];

  return (
    <View style={styles.footer}>
      <View style={[styles.artworkWindow, internal && styles.artworkWindowInternal, isCompact && styles.artworkWindowPhone]}>
        <Image
          source={internal ? require('@/assets/images/footerotras.png') : require('@/assets/images/footer.png')}
          resizeMode="contain"
          style={[styles.footerArtwork, internal && styles.footerArtworkInternal, isCompact && styles.footerArtworkPhone]}
          accessibilityLabel={internal ? 'Tunja, más cerca de ti' : 'Tunja, una ciudad que se recorre'}
        />
      </View>
      <View style={[styles.infoArea, isCompact && styles.infoAreaPhone]}>
        <View style={[styles.infoRow, isCompact && styles.infoRowPhone]}>
          <Pressable onPress={() => router.push('/')} style={[styles.footerBrand, isCompact && styles.footerBrandPhone]}>
            <Image source={require('@/assets/images/Logoo.png')} resizeMode="contain" style={[styles.footerLogo, isCompact && styles.footerLogoPhone]} />
          </Pressable>
          {!isCompact && (
            <View style={styles.footerNav}>
              {links.map((link) => (
                <Pressable key={link.label} onPress={() => router.push(link.route as never)} style={styles.footerNavItem}>
                  <Icon name={link.icon} color="#315b79" size={23} />
                  <Text style={styles.footerNavText}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.footerEnd, isCompact && styles.footerEndPhone]}>
            {!isCompact && <View style={styles.socials}>
              <Icon name="instagram" color="#315b79" size={23} />
              <Icon name="facebook" color="#315b79" size={23} />
            </View>}
            <View style={styles.legalLinks}>
              <Pressable onPress={() => router.push('/politica-de-privacidad')}><Text style={styles.legalLinkText}>Privacidad</Text></Pressable>
              <Text style={styles.legalSeparator}>·</Text>
              <Pressable onPress={() => router.push('/terminos-y-condiciones')}><Text style={styles.legalLinkText}>Términos</Text></Pressable>
            </View>
          </View>
        </View>
        <Text style={styles.copyright}>© 2026 MiRutaTunja · Hecho en Boyacá 💛</Text>
      </View>
    </View>
  );
}
