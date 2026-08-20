import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps } from 'react';

const iconMap = {
  location: 'map-marker-radius-outline',
  service: 'chart-bar',
  notification: 'bell-outline',
  search: 'magnify',
  gps: 'crosshairs-gps',
  arrow: 'arrow-top-right',
  heart: 'heart-outline',
  history: 'history',
  bus: 'bus',
  clock: 'clock-outline',
  star: 'star-outline',
  target: 'compass-outline',
  chevron: 'chevron-right',
  close: 'close',
} as const satisfies Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']>;

type IconName = keyof typeof iconMap;

type IconProps = Readonly<{
  name: IconName;
  color?: string;
  size?: number;
}>;

export default function Icon({ name, color, size = 20 }: IconProps) {
  return <MaterialCommunityIcons name={iconMap[name]} color={color} size={size} />;
}
