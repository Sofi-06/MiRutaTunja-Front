import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';

type RouteCardProps = Readonly<{
  code: string;
  title: string;
  description: string;
  duration: string;
  frequency: string;
  stops: string;
  tone: 'blue' | 'green' | 'coral' | 'gold';
  isCompact?: boolean;
}>;

const toneStyles = {
  blue: styles.routeCodeBlue,
  green: styles.routeCodeGreen,
  coral: styles.routeCodeCoral,
  gold: styles.routeCodeGold,
};

export default function RouteCard({ code, title, description, duration, frequency, stops, tone, isCompact = false }: RouteCardProps) {
  return (
    <Pressable
      style={({ hovered }) => [
        styles.routeCard,
        isCompact && styles.routeCardPhone,
        hovered && styles.routeCardHovered,
      ]}
    >
      <View style={styles.routeCardTop}>
        <Text style={[styles.routeCode, toneStyles[tone]]}>{code}</Text>
        <Icon name="arrow" color={colors.muted} size={16} />
      </View>
      <Text style={[styles.routeCardTitle, isCompact && styles.routeCardTitlePhone]}>{title}</Text>
      <Text style={[styles.routeCardDescription, isCompact && styles.routeCardDescriptionPhone]}>{description}</Text>
      <View style={[styles.routeCardDivider, isCompact && styles.routeCardDividerPhone]} />
      <View style={[styles.routeCardMeta, isCompact && styles.routeCardMetaPhone]}>
        <View style={styles.routeMetaItem}>
          <Icon name="clock" size={15} />
          <Text style={styles.routeMetaText}>{duration}</Text>
        </View>
        <View style={styles.metaSeparator} />
        <Text style={styles.routeMetaText}>{frequency}</Text>
        <View style={styles.metaSeparator} />
        <Text style={styles.routeMetaText}>{stops}</Text>
      </View>
    </Pressable>
  );
}
