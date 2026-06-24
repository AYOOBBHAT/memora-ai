import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_ANIMATION_MS = 220;

export type KeyboardInsetState = {
  isKeyboardVisible: boolean;
  /** Animated bottom padding for a docked footer (iOS). Android uses window resize instead. */
  footerPadding: Animated.Value;
};

/**
 * Tracks keyboard visibility and drives smooth footer inset animation on iOS.
 * On Android with adjustResize, the window resizes — no manual keyboard height padding.
 */
export function useKeyboardInset(): KeyboardInsetState {
  const insets = useSafeAreaInsets();
  const footerPadding = useRef(new Animated.Value(insets.bottom)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isKeyboardVisible) {
      footerPadding.setValue(insets.bottom);
    }
  }, [footerPadding, insets.bottom, isKeyboardVisible]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      setIsKeyboardVisible(true);

      if (Platform.OS !== 'ios') {
        return;
      }

      Animated.timing(footerPadding, {
        toValue: event.endCoordinates.height,
        duration: event.duration ?? DEFAULT_ANIMATION_MS,
        useNativeDriver: false,
      }).start();
    };

    const onHide = (event: KeyboardEvent) => {
      setIsKeyboardVisible(false);

      if (Platform.OS !== 'ios') {
        return;
      }

      Animated.timing(footerPadding, {
        toValue: insets.bottom,
        duration: event.duration ?? DEFAULT_ANIMATION_MS,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, onShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [footerPadding, insets.bottom]);

  return { isKeyboardVisible, footerPadding };
}
