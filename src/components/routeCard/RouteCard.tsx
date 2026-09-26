import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon';
import { colors, styles } from '@/styles/home.styles';
import { isFavorite, toggleFavorite } from '@/services/localData';

import Skeleton from '@/components/ui/Skeleton';

type RouteCardProps = Readonly<{
  code?: string;
  title?: string;
  description?: string;
  duration?: string;
  frequency?: string;
  tone?: 'blue' | 'green' | 'coral' | 'gold';
  isCompact?: boolean;
  isLoading?: boolean;
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

export default function RouteCard({ code = '', title = '', description, duration = '', frequency, tone = 'blue', isCompact = false, isLoading = false, onPress }: RouteCardProps) {
  const [saved, setSaved] = useState(false);
  const favoriteId = `route:${code}`;

  useEffect(() => {
    if (!code) return;
    void isFavorite(favoriteId).then(setSaved);
  }, [favoriteId, code]);

  if (isLoading) {
    return (
      <View style={[styles.routeCard, isCompact && styles.routeCardPhone, { gap: 10, justifyContent: 'space-between', padding: 16 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={64} height={24} borderRadius={12} />
          <Skeleton width={20} height={20} borderRadius={10} />
        </View>
        <View style={{ gap: 8, marginVertical: 4 }}>
          <Skeleton width="88%" height={16} borderRadius={4} />
          <Skeleton width="60%" height={12} borderRadius={4} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={75} height={14} borderRadius={4} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    );
  }

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
        <Pressable
          accessibilityLabel={saved ? 'Quitar ruta de favoritos' : 'Guardar ruta en favoritos'}
          onPress={async (event) => {
            event.stopPropagation();
            const favorites = await toggleFavorite({
              id: favoriteId,
              type: 'route',
              title: code,
              subtitle: title,
            });
            setSaved(favorites.some((favorite) => favorite.id === favoriteId));
          }}
          hitSlop={8}
        >
          <Icon name="star" color={saved ? '#e5a81c' : '#a9b4ba'} size={17} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={[styles.routeCardTitle, isCompact && styles.routeCardTitlePhone]}>{title}</Text>
      <View style={[styles.routeCardMeta, isCompact && styles.routeCardMetaPhone]}>
        <View style={styles.routeMetaItem}>
          <Icon name="clock" color={colors.blueDark} size={16} />
          <Text style={styles.routeMetaText}>{duration}</Text>
        </View>
      </View>
      <View style={styles.routeBusIcon}><Icon name="bus" color={busColors[tone]} size={34} /></View>
    </Pressable>
  );
}
