import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Platform,
  StatusBar as NativeStatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import * as authService from '../../api/services/auth.service';
import { restoreSession } from '../../lib/sessionRestore';
import { performTokenRefresh } from '../../lib/tokenRefresh';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../theme/ThemeProvider';
import {
  LAUNCH_BACKGROUND,
  LAUNCH_SPINNER_COLOR,
  LOGO_ANIMATION_MS,
  LOGO_FADE_MS,
  LOGO_SIZE,
  LOGO_START_SCALE,
  OVERLAY_FADE_MS,
  SPINNER_ROTATION_MS,
  SPINNER_SIZE,
} from './startupTheme';

const appLogo = require('../../../assets/new_memora_app_logo.png');

const LOGO_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface StartupScreenProps {
  onReady: () => void;
  canDismiss: boolean;
  onHidden: () => void;
}

export function StartupScreen({ onReady, canDismiss, onHidden }: StartupScreenProps) {
  const { isDark, theme } = useTheme();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSessionOffline = useAuthStore((state) => state.setSessionOffline);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const introDoneRef = useRef(false);
  const bootstrapDoneRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const hiddenNotifiedRef = useRef(false);
  const nativeSplashHidden = useRef(false);
  const animationStartedRef = useRef(false);

  const overlayOpacity = useSharedValue(1);
  const logoScale = useSharedValue(LOGO_START_SCALE);
  const logoOpacity = useSharedValue(1);
  const spinnerOpacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  const restoreStatusBar = useCallback(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
    if (Platform.OS === 'android') {
      NativeStatusBar.setBackgroundColor(theme.colors.background, true);
      NativeStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    }
  }, [isDark, theme.colors.background]);

  const notifyReady = useCallback(() => {
    if (readyNotifiedRef.current) {
      return;
    }
    if (!introDoneRef.current || !bootstrapDoneRef.current) {
      return;
    }
    readyNotifiedRef.current = true;
    onReady();
  }, [onReady]);

  const markIntroDone = useCallback(() => {
    introDoneRef.current = true;
    notifyReady();
  }, [notifyReady]);

  const revealSpinner = useCallback(() => {
    if (!bootstrapDoneRef.current) {
      setShowSpinner(true);
    }
    markIntroDone();
  }, [markIntroDone]);

  useEffect(() => {
    let cancelled = false;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) {
          setReduceMotion(enabled);
          setMotionReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMotionReady(true);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(LAUNCH_BACKGROUND);
    if (Platform.OS === 'android') {
      NativeStatusBar.setBackgroundColor(LAUNCH_BACKGROUND, false);
      NativeStatusBar.setBarStyle('light-content', false);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      if (refreshToken) {
        await restoreSession({
          refreshToken,
          refresh: performTokenRefresh,
          getMe: authService.getMe,
          clearSession,
          setSessionOffline,
        });
      }

      if (!cancelled) {
        bootstrapDoneRef.current = true;
        notifyReady();
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, refreshToken, clearSession, setSessionOffline, notifyReady]);

  useEffect(() => {
    if (!motionReady || animationStartedRef.current) {
      return;
    }
    animationStartedRef.current = true;

    if (reduceMotion) {
      logoScale.value = 1;
      logoOpacity.value = 0;
      logoOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(revealSpinner)();
        }
      });
      return;
    }

    logoScale.value = LOGO_START_SCALE;
    logoScale.value = withTiming(1, { duration: LOGO_ANIMATION_MS, easing: LOGO_EASING }, (finished) => {
      if (finished) {
        runOnJS(revealSpinner)();
      }
    });
  }, [logoOpacity, logoScale, motionReady, reduceMotion, revealSpinner]);

  useEffect(() => {
    if (!showSpinner) {
      return;
    }

    logoOpacity.value = withTiming(0, { duration: LOGO_FADE_MS, easing: Easing.out(Easing.quad) });
    spinnerOpacity.value = withTiming(1, { duration: LOGO_FADE_MS, easing: Easing.out(Easing.quad) });

    if (reduceMotion) {
      spinnerRotation.value = 0;
      return;
    }

    spinnerRotation.value = 0;
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: SPINNER_ROTATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [logoOpacity, reduceMotion, showSpinner, spinnerOpacity, spinnerRotation]);

  useEffect(() => {
    if (!canDismiss || hiddenNotifiedRef.current) {
      return;
    }

    overlayOpacity.value = withTiming(0, { duration: OVERLAY_FADE_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) {
        hiddenNotifiedRef.current = true;
        runOnJS(restoreStatusBar)();
        runOnJS(onHidden)();
      }
    });
  }, [canDismiss, onHidden, overlayOpacity, restoreStatusBar]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const handleLayout = useCallback(() => {
    if (nativeSplashHidden.current) {
      return;
    }
    nativeSplashHidden.current = true;
    void ExpoSplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <Animated.View
      accessibilityLabel="Loading Memora"
      accessibilityRole="progressbar"
      collapsable={false}
      onLayout={handleLayout}
      pointerEvents={canDismiss ? 'none' : 'auto'}
      style={[styles.overlay, overlayStyle]}
    >
      <StatusBar style="light" />
      <View style={styles.center}>
        <View style={styles.mark}>
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Image
              accessibilityLabel="Memora AI"
              resizeMode="contain"
              source={appLogo}
              style={styles.logo}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.spinnerWrap, spinnerStyle]}>
            <View style={styles.spinnerTrack} />
            <View style={styles.spinnerArc} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: LAUNCH_BACKGROUND,
    zIndex: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  spinnerWrap: {
    position: 'absolute',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerTrack: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(125, 190, 139, 0.18)',
  },
  spinnerArc: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 2,
    borderTopColor: LAUNCH_SPINNER_COLOR,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});
