import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { theme } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'success':
        return [...baseStyle, styles.success];
      case 'warning':
        return [...baseStyle, styles.warning];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        return [...baseTextStyle, styles.primaryText];
      case 'secondary':
        return [...baseTextStyle, styles.secondaryText];
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      case 'success':
        return [...baseTextStyle, styles.successText];
      case 'warning':
        return [...baseTextStyle, styles.warningText];
      default:
        return [...baseTextStyle, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.background : theme.colors.secondary}
          size="small"
        />
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={variant === 'primary' ? theme.colors.background : theme.colors.secondary}
              style={styles.leftIcon}
            />
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={20}
              color={variant === 'primary' ? theme.colors.background : theme.colors.secondary}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Sizes
  small: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    minHeight: 64,
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.secondary,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  success: {
    backgroundColor: theme.colors.green,
  },
  warning: {
    backgroundColor: '#FF9500',
  },
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontFamily: theme.typography.fontFamilyBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: theme.colors.background,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  outlineText: {
    color: theme.colors.secondary,
  },
  successText: {
    color: theme.colors.background,
  },
  warningText: {
    color: theme.colors.background,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
