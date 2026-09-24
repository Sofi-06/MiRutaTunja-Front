import { Text, View } from 'react-native';

import { colors } from '@/styles/home.styles';

export type ToastVariant = 'error' | 'info' | 'success';

export type ToastData = {
  title: string;
  message?: string;
  variant: ToastVariant;
};

const variantColors: Record<ToastVariant, string> = {
  error: colors.coral,
  info: colors.blue,
  success: '#10b981',
};

export default function Toast({ title, message, variant }: ToastData) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'fixed' as any,
        top: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: '#17283b',
          borderLeftWidth: 4,
          borderLeftColor: variantColors[variant],
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          maxWidth: 420,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>{title}</Text>
        {message ? (
          <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}
