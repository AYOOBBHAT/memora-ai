import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextInputSelectionChangeEvent,
} from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';
import { useAuthFormScroll } from './AuthFormScrollContext';
import { AuthFieldError } from './AuthFieldError';

interface AuthTextInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Enables the eye toggle when the field is used for passwords. */
  passwordToggle?: boolean;
}

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(function AuthTextInput(
  {
    label,
    error,
    passwordToggle = false,
    style,
    onFocus,
    onBlur,
    onSelectionChange,
    secureTextEntry,
    ...props
  },
  ref,
) {
  const { theme } = useTheme();
  const scrollContext = useAuthFormScroll();
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [selection, setSelection] = useState<TextInputProps['selection']>();
  const selectionRef = useRef({ start: 0, end: 0 });
  const focusAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const showPasswordToggle = passwordToggle || secureTextEntry === true;
  const isSecure = showPasswordToggle ? isPasswordHidden : Boolean(secureTextEntry);

  const scrollInputIntoView = useCallback(() => {
    if (!scrollContext || !containerRef.current) {
      return;
    }

    containerRef.current.measureInWindow((_x, y, _width, height) => {
      scrollContext.registerFocusedInput(y, height);
      scrollContext.scrollToInput(y, height);
    });
  }, [scrollContext]);

  const handleFocus: TextInputProps['onFocus'] = (event) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onFocus?.(event);
    requestAnimationFrame(scrollInputIntoView);
  };

  const handleBlur: TextInputProps['onBlur'] = (event) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onBlur?.(event);
  };

  const handleSelectionChange = (event: TextInputSelectionChangeEvent) => {
    selectionRef.current = event.nativeEvent.selection;
    onSelectionChange?.(event);
  };

  const handleTogglePasswordVisibility = () => {
    setSelection({ ...selectionRef.current });
    setIsPasswordHidden((current) => !current);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      setSelection(undefined);
    });
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? theme.colors.error : theme.colors.border,
      error ? theme.colors.error : theme.colors.primary,
    ],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceElevated, theme.colors.surface],
  });

  return (
    <View ref={containerRef} style={styles.field}>
      {label ? (
        <Text
          nativeID={`${label}-label`}
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <Animated.View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          autoCorrect={props.autoCorrect ?? (showPasswordToggle ? false : undefined)}
          placeholderTextColor={`${theme.colors.textSecondary}CC`}
          secureTextEntry={isSecure}
          selection={selection}
          style={[
            styles.input,
            showPasswordToggle ? styles.inputWithToggle : null,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.md,
            },
            style,
          ]}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onSelectionChange={handleSelectionChange}
          accessibilityState={{ selected: isFocused }}
          {...props}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityLabel={isPasswordHidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleTogglePasswordVisibility}
            style={({ pressed }) => [
              styles.toggleButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              color={theme.colors.textSecondary}
              name={isPasswordHidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      <AuthFieldError message={error} />
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  inputWithToggle: {
    paddingRight: 8,
  },
  toggleButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginRight: 6,
    width: 48,
  },
});
