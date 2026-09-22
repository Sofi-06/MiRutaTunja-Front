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
  onPress?: () => void;
}>;

const toneStyles = {
  blue: styles.routeCodeBlue,
  green: styles.routeCodeGreen,
  coral: styles.routeCodeCoral,
  gold: styles.routeCodeGold,
};

const busColors = {
  blue: '#1686bd',
  green: '#54a85d',
  coral: '#a94bcb',
  gold: '#efb51d',
};

export default function RouteCard({ code, title, description, duration, frequency, stops, tone, isCompact = false, onPress }: RouteCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.routeCard,
        isCompact && styles.routeCardPhone,
        hovered && styles.routeCardHovered,
      ]}
    >
      <View style={styles.routeCardTop}>
        <Text style={[styles.routeCode, toneStyles[tone]]}>{code}</Text>
        <Icon name="star" color="#a9b4ba" size={17} />
      </View>
      <Text style={[styles.routeCardTitle, isCompact && styles.routeCardTitlePhone]}>{title}</Text>
      <View style={[styles.routeCardMeta, isCompact && styles.routeCardMetaPhone]}>
        <View style={styles.routeMetaItem}>
          <Icon name="clock" color={colors.blueDark} size={16} />
          <Text style={styles.routeMetaText}>{duration}</Text>
        </View>
        <View style={styles.routeMetaItem}>
          <Icon name="pin" color={colors.blueDark} size={16} />
          <Text style={styles.routeMetaText}>{stops}</Text>
        </View>
      </View>
      <View style={styles.routeBusIcon}><Icon name="bus" color={busColors[tone]} size={34} /></View>
    </Pressable>
  );
}
