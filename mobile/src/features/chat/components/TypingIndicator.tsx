import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

const DOT_SIZE = 7;
const ANIM_MS = 400;

export function TypingIndicator() {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: ANIM_MS,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: ANIM_MS,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 130);
    const a3 = animateDot(dot3, 260);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dots = [dot1, dot2, dot3];

  return (
    <View accessibilityLabel="Memora is typing" style={styles.row}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: theme.colors.primary,
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0.35, 1],
                    outputRange: [0.85, 1.1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 2,
  },
  dot: {
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
    width: DOT_SIZE,
  },
});
