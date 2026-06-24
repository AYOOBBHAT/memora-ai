import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { KeyboardScrollContext } from './KeyboardScrollContext';

type BaseProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

type ComposerProps = BaseProps & {
  variant: 'composer';
  footer: ReactNode;
  /** Safe area edges when the keyboard is hidden. Defaults to bottom only. */
  safeAreaEdges?: Edge[];
};

type ScrollProps = BaseProps & {
  variant: 'scroll';
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  keyboardVerticalOffset?: number;
  scrollViewProps?: Omit<
    ScrollViewProps,
    'children' | 'contentContainerStyle' | 'style' | 'ref' | 'onScroll'
  >;
};

export type KeyboardAwareScreenProps = ComposerProps | ScrollProps;

export function KeyboardAwareScreen(props: KeyboardAwareScreenProps) {
  if (props.variant === 'composer') {
    return <KeyboardAwareComposerScreen {...props} />;
  }

  return <KeyboardAwareScrollScreen {...props} />;
}

function KeyboardAwareComposerScreen({
  children,
  footer,
  style,
  backgroundColor,
  safeAreaEdges = ['bottom'],
}: ComposerProps) {
  const { isKeyboardVisible, footerPadding } = useKeyboardInset();

  const edges = useMemo(
    () => (isKeyboardVisible ? ([] as Edge[]) : safeAreaEdges),
    [isKeyboardVisible, safeAreaEdges],
  );

  return (
    <View style={[styles.flex, backgroundColor ? { backgroundColor } : null, style]}>
      <SafeAreaView edges={edges} style={styles.flex}>
        <View style={styles.flex}>{children}</View>
        <Animated.View style={{ paddingBottom: Platform.OS === 'ios' ? footerPadding : 0 }}>
          {footer}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function KeyboardAwareScrollScreen({
  children,
  contentContainerStyle,
  style,
  backgroundColor,
  footer,
  keyboardVerticalOffset = 0,
  scrollViewProps,
}: ScrollProps) {
  const { isKeyboardVisible } = useKeyboardInset();
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const focusedInputRef = useRef<{ y: number; height: number } | null>(null);

  const scrollToInput = useCallback(
    (inputY: number, inputHeight: number) => {
      const tryScroll = () => {
        const metrics = Keyboard.metrics();
        if (!metrics || metrics.height <= 0) {
          return false;
        }

        const visibleBottom = metrics.screenY - keyboardVerticalOffset - 16;
        const inputBottom = inputY + inputHeight;

        if (inputBottom <= visibleBottom) {
          return true;
        }

        scrollRef.current?.scrollTo({
          y: scrollOffsetRef.current + (inputBottom - visibleBottom),
          animated: true,
        });
        return true;
      };

      if (!tryScroll()) {
        requestAnimationFrame(tryScroll);
      }
    },
    [keyboardVerticalOffset],
  );

  const registerFocusedInput = useCallback((inputY: number, inputHeight: number) => {
    focusedInputRef.current = { y: inputY, height: inputHeight };
  }, []);

  const scrollContextValue = useMemo(
    () => ({
      scrollToInput,
      registerFocusedInput,
    }),
    [registerFocusedInput, scrollToInput],
  );

  useEffect(() => {
    if (!isKeyboardVisible || !focusedInputRef.current) {
      return;
    }

    const { y, height } = focusedInputRef.current;
    const timer = setTimeout(() => scrollToInput(y, height), Platform.OS === 'ios' ? 50 : 100);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible, scrollToInput]);

  return (
    <KeyboardScrollContext.Provider value={scrollContextValue}>
      <View style={[styles.flex, backgroundColor ? { backgroundColor } : null, style]}>
        <Pressable
          accessibilityRole="none"
          accessible={false}
          onPress={Keyboard.dismiss}
          style={styles.flex}
        >
          <ScrollView
            ref={scrollRef}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.flex}
            {...scrollViewProps}
          >
            {children}
            {footer}
          </ScrollView>
        </Pressable>
      </View>
    </KeyboardScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
