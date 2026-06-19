import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface ChatCodeBlockProps {
  code: string;
  language?: string;
}

export function ChatCodeBlock({ code, language }: ChatCodeBlockProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      Alert.alert('Copy failed', 'Unable to copy code to clipboard.');
    }
  }, [code]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.language,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSizes.xs,
              fontWeight: theme.typography.fontWeights.medium,
            },
          ]}
        >
          {language?.trim() || 'code'}
        </Text>
        <Pressable
          accessibilityLabel="Copy code"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => void handleCopy()}
          style={({ pressed }) => [styles.copyButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons
            color={copied ? theme.colors.primary : theme.colors.textSecondary}
            name={copied ? 'checkmark' : 'copy-outline'}
            size={16}
          />
        </Pressable>
      </View>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
        <Text
          selectable
          style={[
            styles.code,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSizes.sm,
            },
          ]}
        >
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  language: {
    letterSpacing: 0.4,
    textTransform: 'lowercase',
  },
  copyButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  code: {
    fontFamily: 'monospace',
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
