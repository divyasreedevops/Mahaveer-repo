import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius, spacing, fontSize, fontWeight, shadows } from '@/theme';

export interface DialogAction {
  text: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'destructive' | 'success';
}

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  actions?: DialogAction[];
  onDismiss?: () => void;
}

export const AppDialog: React.FC<AppDialogProps> = ({
  visible,
  title,
  message,
  icon,
  iconColor,
  iconBgColor,
  actions = [{ text: 'OK', variant: 'primary' }],
  onDismiss,
}) => {
  const { colors: c } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const getButtonStyle = (variant: string = 'primary') => {
    switch (variant) {
      case 'destructive':
        return { bg: c.danger, fg: '#FFF' };
      case 'success':
        return { bg: c.success, fg: '#FFF' };
      case 'primary':
        return { bg: c.primary, fg: '#FFF' };
      default:
        return { bg: c.surfaceHover, fg: c.textSecondary };
    }
  };

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View
          style={[
            dialogStyles.overlay,
            { backgroundColor: c.overlay, opacity: opacityAnim },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                dialogStyles.card,
                shadows.xl,
                {
                  backgroundColor: c.surface,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {icon && (
                <View
                  style={[
                    dialogStyles.iconContainer,
                    { backgroundColor: iconBgColor || c.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={32}
                    color={iconColor || c.primary}
                  />
                </View>
              )}

              <Text style={[dialogStyles.title, { color: c.text }]}>
                {title}
              </Text>

              {message && (
                <Text style={[dialogStyles.message, { color: c.textSecondary }]}>
                  {message}
                </Text>
              )}

              <View
                style={[
                  dialogStyles.actions,
                  actions.length === 1 && dialogStyles.singleAction,
                ]}
              >
                {actions.map((action, index) => {
                  const btnStyle = getButtonStyle(action.variant);
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        action.onPress?.();
                        if (!action.onPress) onDismiss?.();
                      }}
                      activeOpacity={0.8}
                      style={[
                        dialogStyles.actionButton,
                        {
                          backgroundColor: btnStyle.bg,
                          flex: actions.length > 1 ? 1 : undefined,
                          minWidth: actions.length === 1 ? '100%' : undefined,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          dialogStyles.actionText,
                          { color: btnStyle.fg },
                        ]}
                      >
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const dialogStyles = {
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing['2xl'],
  },
  card: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    width: '100%' as const,
    maxWidth: 340,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    width: '100%' as const,
    marginTop: spacing.md,
  },
  singleAction: {
    marginTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  actionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
};
