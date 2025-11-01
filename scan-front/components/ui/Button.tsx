import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
    };

    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 12, paddingHorizontal: 20 },
      lg: { paddingVertical: 16, paddingHorizontal: 24 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: '#000' },
      secondary: { backgroundColor: '#6b7280' },
      outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#000' },
    };

    return { ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] };
  };

  const getTextStyles = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: '#fff' },
      secondary: { color: '#fff' },
      outline: { color: '#000' },
    };

    return {
      fontWeight: '600',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#000' : '#fff'} />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}
