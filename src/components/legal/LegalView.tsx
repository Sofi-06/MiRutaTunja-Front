import { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import PageScaffold from '@/components/layout/PageScaffold';
import Icon from '@/components/ui/Icon';
import Footer from '@/components/footer/Footer';

export type LegalTab = 'privacy' | 'terms';

type LegalViewProps = Readonly<{
  initialTab?: LegalTab;
}>;

export default function LegalView({ initialTab = 'privacy' }: LegalViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isNative = Platform.OS !== 'web';
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    const email = 'contacto@mirutatunja.com';
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        void Linking.openURL(`mailto:${email}?subject=Atenci%C3%B3n%20Datos%20Personales%20-%20MiRutaTunja`);
      }
    } catch {
      void Linking.openURL(`mailto:${email}?subject=Atenci%C3%B3n%20Datos%20Personales%20-%20MiRutaTunja`);
    }
  };

  const handleOpenEmail = () => {
    void Linking.openURL('mailto:contacto@mirutatunja.com?subject=Atenci%C3%B3n%20Datos%20Personales%20-%20MiRutaTunja');
  };

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    if (tab === 'privacy') {
      router.setParams({ tab: 'privacy' });
    } else {
      router.setParams({ tab: 'terms' });
    }
  };

  return (
    <PageScaffold>
      <View style={[styles.container, isCompact && styles.containerCompact]}>
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Icon name="shield" size={14} color="#3f719b" />
              <Text style={styles.pillBadgeText}>TRANSPARENCIA & PRIVACIDAD</Text>
            </View>
            <View style={[styles.pillBadge, styles.pillBadgeAccent]}>
              <Icon name="location" size={14} color="#d8957d" />
              <Text style={[styles.pillBadgeText, styles.pillBadgeTextAccent]}>TUNJA, BOYACÁ</Text>
            </View>
          </View>

          <Text style={[styles.mainTitle, isCompact && styles.mainTitleCompact]}>
            {activeTab === 'privacy' ? 'Política de Tratamiento de Datos' : 'Términos y Condiciones de Uso'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {activeTab === 'privacy'
              ? 'Conoce cómo protegemos tu información personal y garantizamos el cumplimiento de la Ley 1581 de 2012 de Protección de Datos Personales en Colombia.'
              : 'Lineamientos, compromisos y condiciones para el uso de la plataforma web de transporte público urbano MiRutaTunja.'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="clock" size={15} color="#728092" />
              <Text style={styles.metaText}>Última actualización: 19 de septiembre de 2026</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Icon name="scale" size={15} color="#728092" />
              <Text style={styles.metaText}>Marco Legal: Ley 1581 de 2012 · Ley 1480 de 2011</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => handleTabChange('privacy')}
            style={[
              styles.tabButton,
              activeTab === 'privacy' && styles.tabButtonActive,
            ]}
          >
            <Icon
              name="shield"
              size={18}
              color={activeTab === 'privacy' ? '#2b5479' : '#728092'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'privacy' && styles.tabButtonTextActive,
              ]}
            >
              Política de Privacidad y Datos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange('terms')}
            style={[
              styles.tabButton,
              activeTab === 'terms' && styles.tabButtonActive,
            ]}
          >
            <Icon
              name="document"
              size={18}
              color={activeTab === 'terms' ? '#2b5479' : '#728092'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'terms' && styles.tabButtonTextActive,
              ]}
            >
              Términos y Condiciones
            </Text>
          </Pressable>
        </View>

        {/* Key Highlights Banner */}
        <View style={[styles.summaryBox, isCompact && styles.summaryBoxCompact]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconWrap}>
              <Icon name="info" size={20} color="#2b5479" />
            </View>
            <Text style={styles.summaryTitle}>Resumen para el Ciudadano</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}>
              <View style={styles.summaryCardNumberWrap}>
                <Text style={styles.summaryCardNumber}>1</Text>
              </View>
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardHeading}>Ubicación Transitoria</Text>
                <Text style={styles.summaryCardDesc}>
                  Tu GPS se utiliza exclusivamente en el navegador para calcular rutas y paraderos cercanos en Tunja. No rastreamos tu historial fuera de la consulta.
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}>
              <View style={styles.summaryCardNumberWrap}>
                <Text style={styles.summaryCardNumber}>2</Text>
              </View>
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardHeading}>Cero Datos Sensibles</Text>
                <Text style={styles.summaryCardDesc}>
                  No solicitamos información biométrica, médica, política o bancaria. Tus preferencias y favoritos se guardan localmente en tu dispositivo.
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}>
              <View style={styles.summaryCardNumberWrap}>
                <Text style={styles.summaryCardNumber}>3</Text>
              </View>
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryCardHeading}>Atención Directa ARCO</Text>
                <Text style={styles.summaryCardDesc}>
                  Puedes consultar, actualizar o solicitar la supresión de tus datos cuando lo desees a través de nuestro canal formal de PQR.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Legal Document Content */}
        {activeTab === 'privacy' ? (
          <View style={styles.documentBody}>
            {/* Section 1 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Identificación del Responsable del Tratamiento</Text>
              </View>
              <Text style={styles.paragraph}>
                La plataforma web <Text style={styles.boldText}>MiRutaTunja</Text> (en adelante, &quot;la Plataforma&quot;), operada y administrada desde la ciudad de Tunja, Boyacá, República de Colombia, actúa en calidad de Responsable del Tratamiento de los datos personales recolectados a través del sitio web.
              </Text>
              <View style={styles.contactCallout}>
                <View style={styles.contactCalloutLeft}>
                  <Icon name="mail" size={20} color="#2b5479" />
                  <View>
                    <Text style={styles.contactCalloutTitle}>Canal de Contacto y PQR</Text>
                    <Text style={styles.contactCalloutEmail}>contacto@mirutatunja.com</Text>
                  </View>
                </View>
                <View style={styles.contactCalloutActions}>
                  <Pressable onPress={handleCopyEmail} style={styles.contactActionBtn}>
                    <Icon name={copied ? 'check' : 'copy'} size={16} color="#2b5479" />
                    <Text style={styles.contactActionBtnText}>
                      {copied ? '¡Copiado!' : 'Copiar'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleOpenEmail} style={[styles.contactActionBtn, styles.contactActionBtnPrimary]}>
                    <Icon name="external" size={16} color="#ffffff" />
                    <Text style={[styles.contactActionBtnText, styles.contactActionBtnTextPrimary]}>Redactar</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Section 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Datos Personales Recolectados y Finalidad</Text>
              </View>
              <Text style={styles.paragraph}>
                Para el adecuado funcionamiento de los servicios cartográficos y de consulta de movilidad urbana en la ciudad de Tunja, recolectamos y procesamos las siguientes categorías de datos:
              </Text>

              <View style={styles.detailList}>
                <View style={styles.detailItem}>
                  <View style={styles.detailBulletIcon}>
                    <Icon name="location" size={16} color="#3f719b" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>Ubicación Geográfica (GPS / Dirección IP)</Text>
                    <Text style={styles.detailText}>
                      Con la única finalidad de ubicar al usuario en el mapa interactivo para mostrar las rutas de transporte público colectivo, paraderos e itinerarios más cercanos a su posición actual en Tunja.
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailBulletIcon}>
                    <Icon name="route" size={16} color="#3f719b" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>Datos de Uso y Preferencias</Text>
                    <Text style={styles.detailText}>
                      Rutas consultadas recientemente, lugares frecuentes y favoritos guardados en almacenamiento local (<Text style={styles.codeSnippet}>localStorage</Text>), así como métricas técnicas de rendimiento para optimizar la experiencia de navegación.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.noticeBox}>
                <Icon name="shield" size={18} color="#d8957d" />
                <Text style={styles.noticeText}>
                  <Text style={styles.boldText}>Nota de Seguridad:</Text> La Plataforma no solicita ni almacena datos personales sensibles (tales como origen racial, orientación política, datos de salud, datos biométricos ni información financiera).
                </Text>
              </View>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Autorización y Base Legal</Text>
              </View>
              <Text style={styles.paragraph}>
                El tratamiento de datos personales se fundamenta en la autorización previa, expresa e informada del titular, la cual se otorga al aceptar el aviso de permisos de geolocalización en su dispositivo o al interactuar con las funciones interactivas del sitio web.
              </Text>
              <Text style={styles.paragraph}>
                Todo el tratamiento se rige en estricto cumplimiento del marco legal colombiano:
              </Text>
              <View style={styles.legalChipsRow}>
                <View style={styles.legalChip}>
                  <Icon name="check" size={14} color="#2b5479" />
                  <Text style={styles.legalChipText}>Ley Estatutaria 1581 de 2012</Text>
                </View>
                <View style={styles.legalChip}>
                  <Icon name="check" size={14} color="#2b5479" />
                  <Text style={styles.legalChipText}>Decreto Reglamentario 1377 de 2013</Text>
                </View>
                <View style={styles.legalChip}>
                  <Icon name="check" size={14} color="#2b5479" />
                  <Text style={styles.legalChipText}>Circular Única de la SIC</Text>
                </View>
              </View>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Uso de Cookies y Almacenamiento Local</Text>
              </View>
              <Text style={styles.paragraph}>
                Utilizamos tecnologías estándar de almacenamiento en el navegador del cliente (<Text style={styles.codeSnippet}>localStorage</Text>, <Text style={styles.codeSnippet}>sessionStorage</Text> y cookies técnicas) con los siguientes propósitos exclusivos:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Guardar preferencias de visualización del mapa, capas de paraderos, rutas preferidas y configuración de interfaz.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Permitir una navegación fluida y de alta velocidad sin necesidad de solicitar la misma configuración en cada visita.
                  </Text>
                </View>
              </View>
              <Text style={[styles.paragraph, { marginTop: 12 }]}>
                El usuario puede configurar, bloquear o eliminar las cookies en cualquier momento a través de las opciones de privacidad y seguridad de su navegador web.
              </Text>
            </View>

            {/* Section 5 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Derechos de los Titulares (Derechos ARCO)</Text>
              </View>
              <Text style={styles.paragraph}>
                De conformidad con el artículo 8 de la Ley 1581 de 2012, como titular de los datos personales tienes derecho a:
              </Text>
              <View style={styles.arcoGrid}>
                <View style={styles.arcoCard}>
                  <View style={styles.arcoIconBadge}>
                    <Icon name="search" size={16} color="#2b5479" />
                  </View>
                  <Text style={styles.arcoCardTitle}>Conocer y Actualizar</Text>
                  <Text style={styles.arcoCardText}>
                    Acceder de forma gratuita a tus datos personales y rectificarlos ante cualquier inexactitud.
                  </Text>
                </View>

                <View style={styles.arcoCard}>
                  <View style={styles.arcoIconBadge}>
                    <Icon name="document" size={16} color="#2b5479" />
                  </View>
                  <Text style={styles.arcoCardTitle}>Prueba de Autorización</Text>
                  <Text style={styles.arcoCardText}>
                    Solicitar constancia de la autorización concedida para el tratamiento de tus datos.
                  </Text>
                </View>

                <View style={styles.arcoCard}>
                  <View style={styles.arcoIconBadge}>
                    <Icon name="trash" size={16} color="#2b5479" />
                  </View>
                  <Text style={styles.arcoCardTitle}>Revocar y Suprimir</Text>
                  <Text style={styles.arcoCardText}>
                    Revocar la autorización o solicitar la eliminación de datos cuando no medie un deber legal.
                  </Text>
                </View>

                <View style={styles.arcoCard}>
                  <View style={styles.arcoIconBadge}>
                    <Icon name="scale" size={16} color="#2b5479" />
                  </View>
                  <Text style={styles.arcoCardTitle}>Quejas ante la SIC</Text>
                  <Text style={styles.arcoCardText}>
                    Presentar quejas ante la Superintendencia de Industria y Comercio por presuntas infracciones.
                  </Text>
                </View>
              </View>

              <View style={styles.pqrCard}>
                <Text style={styles.pqrCardTitle}>Procedimiento para el Ejercicio de Derechos</Text>
                <Text style={styles.pqrCardText}>
                  Para ejercer cualquiera de tus derechos ARCO, envía una comunicación escrita dirigida a <Text style={styles.boldText}>contacto@mirutatunja.com</Text> indicando en el asunto: <Text style={styles.codeSnippet}>Atención Datos Personales - MiRutaTunja</Text>, adjuntando la descripción clara de tu solicitud.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.documentBody}>
            {/* Section 1 - Términos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>1</Text>
                </View>
                <Text style={styles.sectionHeading}>Aceptación de los Términos</Text>
              </View>
              <Text style={styles.paragraph}>
                Al acceder, navegar, interactuar o utilizar la plataforma web <Text style={styles.boldText}>MiRutaTunja</Text>, el usuario manifiesta su aceptación explícita, plena y sin reservas de los presentes Términos y Condiciones.
              </Text>
              <Text style={styles.paragraph}>
                Si no se encuentra de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar el sitio web y sus servicios cartográficos.
              </Text>
            </View>

            {/* Section 2 - Términos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>2</Text>
                </View>
                <Text style={styles.sectionHeading}>Naturaleza del Servicio</Text>
              </View>
              <Text style={styles.paragraph}>
                MiRutaTunja es un servicio web informativo, pedagógico y cívico diseñado para facilitar la visualización, consulta de itinerarios, paraderos, tiempos estimados y trazados de rutas de transporte público colectivo en la ciudad de Tunja, Boyacá.
              </Text>
              <View style={styles.noticeBox}>
                <Icon name="info" size={18} color="#d8957d" />
                <Text style={styles.noticeText}>
                  <Text style={styles.boldText}>Exención de vinculación:</Text> MiRutaTunja es una iniciativa tecnológica independiente. No es una empresa de transporte público ni se encuentra afiliada formalmente a las empresas prestadoras del servicio de transporte urbano ni a las autoridades de tránsito municipales, salvo que se señale expresamente lo contrario.
                </Text>
              </View>
            </View>

            {/* Section 3 - Términos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>3</Text>
                </View>
                <Text style={styles.sectionHeading}>Exoneración de Responsabilidad</Text>
              </View>
              <View style={styles.detailList}>
                <View style={styles.detailItem}>
                  <View style={styles.detailBulletIcon}>
                    <Icon name="clock" size={16} color="#3f719b" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>Exactitud y Actualización de la Información</Text>
                    <Text style={styles.detailText}>
                      Si bien se ejecutan revisiones continuas para mantener actualizados los recorridos, paraderos y frecuencias, la Plataforma no puede garantizar que la información esté totalmente libre de errores, variaciones temporales por desvíos viales, obras públicas, festividades o decisiones operativas imprevistas de las empresas transportadoras o autoridades de tránsito.
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailBulletIcon}>
                    <Icon name="service" size={16} color="#3f719b" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>Disponibilidad Técnica de la Plataforma</Text>
                    <Text style={styles.detailText}>
                      No se garantiza la operatividad ininterrumpida de la plataforma ni se asume responsabilidad por interrupciones atribuibles a redes de telecomunicaciones, servidores de alojamiento (hosting) o proveedores de servicios cartográficos y de geocodificación de terceros.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 4 - Términos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>4</Text>
                </View>
                <Text style={styles.sectionHeading}>Propiedad Intelectual</Text>
              </View>
              <Text style={styles.paragraph}>
                Todos los elementos constitutivos de la Plataforma —incluyendo el código fuente, la arquitectura de la interfaz de usuario, diseño visual, logotipos, iconografía, componentes gráficos y bases de datos estructuradas— son propiedad exclusiva de MiRutaTunja o cuentan con las respectivas licencias de uso y reutilización de datos geoespaciales abiertos (como OpenStreetMap / OSRM).
              </Text>
              <Text style={styles.paragraph}>
                Queda expresamente prohibida su reproducción total o parcial, explotación comercial no autorizada o ingeniería inversa sin autorización previa y por escrito de sus administradores.
              </Text>
            </View>

            {/* Section 5 - Términos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>5</Text>
                </View>
                <Text style={styles.sectionHeading}>Ley Aplicable y Jurisdicción</Text>
              </View>
              <Text style={styles.paragraph}>
                Los presentes Términos y Condiciones se interpretan y rigen íntegramente por el ordenamiento jurídico de la República de Colombia, especialmente por la Ley 1480 de 2011 (Estatuto del Consumidor) y demás normas concordantes.
              </Text>
              <Text style={styles.paragraph}>
                Cualquier discrepancia, controversia o reclamo que surja en relación con el uso de la Plataforma será sometido a la jurisdicción ordinaria de los jueces competentes de la ciudad de <Text style={styles.boldText}>Tunja, Boyacá</Text>.
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Navigation Shortcut */}
        <View style={styles.backHomeBox}>
          <Pressable onPress={() => router.push('/')} style={styles.backHomeBtn}>
            <Icon name="back" size={18} color="#2b5479" />
            <Text style={styles.backHomeBtnText}>Volver al Mapa de Rutas</Text>
          </Pressable>
        </View>
      </View>

      {/* Global Footer */}
      <Footer isCompact={isCompact} />
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroSection: {
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#edf6fc',
    borderWidth: 1,
    borderColor: '#d2e5f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillBadgeAccent: {
    backgroundColor: '#fef7f4',
    borderColor: '#f4ddd3',
  },
  pillBadgeText: {
    color: '#2b5479',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pillBadgeTextAccent: {
    color: '#c4785e',
  },
  mainTitle: {
    color: '#17283b',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 12,
  },
  mainTitleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#586b7f',
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 760,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5edf3',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#728092',
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c1cfdb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e6eff5',
    padding: 5,
    borderRadius: 14,
    marginBottom: 26,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#17283b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButtonText: {
    color: '#728092',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#17283b',
    fontWeight: '800',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dce8ef',
    padding: 22,
    marginBottom: 28,
  },
  summaryBoxCompact: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#edf6fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: '#17283b',
    fontSize: 17,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  summaryCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#f8fbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5edf3',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCardCompact: {
    minWidth: '100%',
  },
  summaryCardNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2b5479',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryCardContent: {
    flex: 1,
  },
  summaryCardHeading: {
    color: '#17283b',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCardDesc: {
    color: '#586b7f',
    fontSize: 12,
    lineHeight: 17,
  },
  documentBody: {
    gap: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce8ef',
    padding: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#edf6fc',
    borderWidth: 1,
    borderColor: '#cfe2ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    color: '#2b5479',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeading: {
    color: '#17283b',
    fontSize: 19,
    fontWeight: '800',
    flex: 1,
  },
  paragraph: {
    color: '#33485d',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#17283b',
  },
  codeSnippet: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#edf4f8',
    color: '#2b5479',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  contactCallout: {
    marginTop: 8,
    backgroundColor: '#f6fafe',
    borderWidth: 1,
    borderColor: '#d4e7f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactCalloutTitle: {
    color: '#586b7f',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactCalloutEmail: {
    color: '#17283b',
    fontSize: 15,
    fontWeight: '700',
  },
  contactCalloutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cce1f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  contactActionBtnPrimary: {
    backgroundColor: '#2b5479',
    borderColor: '#2b5479',
  },
  contactActionBtnText: {
    color: '#2b5479',
    fontSize: 13,
    fontWeight: '700',
  },
  contactActionBtnTextPrimary: {
    color: '#ffffff',
  },
  detailList: {
    gap: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f8fbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f0f6',
    padding: 14,
  },
  detailBulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#edf6fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    color: '#17283b',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailText: {
    color: '#586b7f',
    fontSize: 14,
    lineHeight: 21,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fdf7f4',
    borderWidth: 1,
    borderColor: '#f5ded6',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    color: '#7a4e3e',
    fontSize: 13,
    lineHeight: 19,
  },
  legalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  legalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#edf6fc',
    borderWidth: 1,
    borderColor: '#cfe2ef',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legalChipText: {
    color: '#2b5479',
    fontSize: 12,
    fontWeight: '700',
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: '#3f719b',
    fontSize: 18,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    color: '#33485d',
    fontSize: 14,
    lineHeight: 22,
  },
  arcoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  arcoCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 200,
    backgroundColor: '#f8fbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5edf3',
    padding: 14,
  },
  arcoIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#edf6fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  arcoCardTitle: {
    color: '#17283b',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  arcoCardText: {
    color: '#586b7f',
    fontSize: 12,
    lineHeight: 17,
  },
  pqrCard: {
    backgroundColor: '#f6fafe',
    borderWidth: 1,
    borderColor: '#d4e7f6',
    borderRadius: 12,
    padding: 16,
  },
  pqrCardTitle: {
    color: '#17283b',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  pqrCardText: {
    color: '#445b71',
    fontSize: 13,
    lineHeight: 20,
  },
  backHomeBox: {
    marginTop: 28,
    alignItems: 'center',
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0dfeb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backHomeBtnText: {
    color: '#2b5479',
    fontSize: 14,
    fontWeight: '700',
  },
});
