import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';

interface HighlightedTextProps extends TextProps {
  text: string;
  query: string;
  highlightStyle?: TextProps['style'];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightedText({ text, query, style, highlightStyle, ...rest }: HighlightedTextProps) {
  const { theme } = useTheme();
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return (
      <Text style={style} {...rest}>
        {text}
      </Text>
    );
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi'));

  return (
    <Text style={style} {...rest}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();
        return (
          <Text
            key={`${part}-${index}`}
            style={
              isMatch
                ? [
                    styles.highlight,
                    {
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.primaryText,
                    },
                    highlightStyle,
                  ]
                : undefined
            }
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    borderRadius: 2,
  },
});
