import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { footerStyles as styles } from '@/styles/footer.styles';

type FooterProps = Readonly<{
  isCompact?: boolean;
}>;

type NavLink = {
  label: string;
  route?: string;
};

type LinkSection = {
  title: string;
  links: NavLink[];
};

const FOOTER_SECTIONS: LinkSection[] = [
  {
    title: 'NAVEGA',
    links: [
      { label: 'Inicio', route: '/' },
      { label: 'Rutas', route: '/routes' },
      { label: 'Turismo', route: '/explore' },
      { label: 'Favoritos', route: '/favorites' },
    ],
  },
  {
    title: 'TURISMO',
    links: [
      { label: 'Centro histórico' },
      { label: 'Zona norte' },
      { label: 'Zona sur' },
      { label: 'UPTC' },
    ],
  },
  {
    title: 'RUTASTUNJA',
    links: [
      { label: 'Ayuda' },
      { label: 'Contacto' },
      { label: 'Privacidad' },
      { label: 'Términos' },
    ],
  },
];

export default function Footer({ isCompact = false }: FooterProps) {
  const router = useRouter();

  const handlePress = (route?: string) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <View style={styles.footer}>
      <View style={[styles.footerInner, isCompact && styles.footerInnerPhone]}>
        <View style={[styles.footerMain, isCompact && styles.footerMainPhone]}>
          {/* Brand Column */}
          <View style={[styles.brandColumn, isCompact && styles.brandColumnPhone]}>
            <Pressable onPress={() => router.push('/')} style={[styles.brandRow, isCompact && styles.brandRowPhone]}>
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
                <Text style={styles.brandTagline}>MOVILIDAD URBANA</Text>
              </View>
            </Pressable>
            <Text style={[styles.brandDescription, isCompact && styles.brandDescriptionPhone]}>
              Información de transporte público urbano para Tunja, Boyacá. Un proyecto pensado para la ciudad y su gente.
            </Text>
          </View>

          {/* Navigation Links Columns */}
          <View style={[styles.linksGroup, isCompact && styles.linksGroupPhone]}>
            {FOOTER_SECTIONS.map((section) => (
              <View key={section.title} style={[styles.linkColumn, isCompact && styles.linkColumnPhone]}>
                <Text style={[styles.columnTitle, isCompact && styles.columnTitlePhone]}>{section.title}</Text>
                {section.links.map((link) => (
                  <Pressable
                    key={link.label}
                    onPress={() => handlePress(link.route)}
                    style={({ pressed }) => [
                      styles.linkItem,
                      isCompact && styles.linkItemPhone,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.linkText, isCompact && styles.linkTextPhone]}>
                      {link.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Divider line */}
        <View style={[styles.divider, isCompact && styles.dividerPhone]} />

        {/* Bottom Row */}
        <View style={[styles.bottomRow, isCompact && styles.bottomRowPhone]}>
          <Text style={[styles.copyrightText, isCompact && styles.copyrightTextPhone]}>
            © 2026 RutasTunja · Hecho en Boyacá
          </Text>
        </View>
      </View>
    </View>
  );
}
