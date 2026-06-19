import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme/ThemeProvider';
import { ChatCodeBlock } from './ChatCodeBlock';

interface ChatMarkdownProps {
  content: string;
  textColor: string;
  isError?: boolean;
}

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'code'; language?: string; code: string };

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const segments = content.split(/```/);

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) {
      continue;
    }

    if (index % 2 === 1) {
      const firstLineBreak = segment.indexOf('\n');
      const language =
        firstLineBreak === -1 ? undefined : segment.slice(0, firstLineBreak).trim();
      const code =
        firstLineBreak === -1 ? segment.trim() : segment.slice(firstLineBreak + 1).replace(/\n$/, '');
      blocks.push({ type: 'code', language, code });
      continue;
    }

    const paragraphs = segment.split(/\n{2,}/);
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        continue;
      }

      const lines = trimmed.split('\n');
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        blocks.push({
          type: 'list',
          ordered: false,
          items: lines.map((line) => line.replace(/^\s*[-*]\s+/, '')),
        });
        continue;
      }

      if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
        blocks.push({
          type: 'list',
          ordered: true,
          items: lines.map((line) => line.replace(/^\s*\d+\.\s+/, '')),
        });
        continue;
      }

      if (lines.length > 1 && lines.every((line) => line.includes('|'))) {
        const rows = lines
          .filter((line) => !/^\s*\|?[\s:-]+\|/.test(line))
          .map((line) =>
            line
              .split('|')
              .map((cell) => cell.trim())
              .filter((cell, cellIndex, cells) => !(cellIndex === 0 && cell === '') && !(cellIndex === cells.length - 1 && cell === '')),
          )
          .filter((row) => row.length > 0);
        if (rows.length > 0) {
          blocks.push({ type: 'table', rows });
          continue;
        }
      }

      if (lines.length === 1) {
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          blocks.push({
            type: 'heading',
            level: headingMatch[1].length,
            text: headingMatch[2],
          });
          continue;
        }

        if (trimmed.startsWith('> ')) {
          blocks.push({ type: 'quote', text: trimmed.slice(2) });
          continue;
        }
      }

      blocks.push({ type: 'paragraph', text: trimmed.replace(/\n/g, ' ') });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', text: content }];
}

function renderInlineText(text: string, textColor: string, keyPrefix: string) {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`${keyPrefix}-t-${partIndex++}`}>{text.slice(lastIndex, match.index)}</Text>,
      );
    }

    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <Text key={`${keyPrefix}-b-${partIndex++}`} style={{ fontWeight: '700' }}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith('*')) {
      parts.push(
        <Text key={`${keyPrefix}-i-${partIndex++}`} style={{ fontStyle: 'italic' }}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <Text
          key={`${keyPrefix}-c-${partIndex++}`}
          style={{
            fontFamily: 'monospace',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            borderRadius: 4,
            paddingHorizontal: 4,
          }}
        >
          {token.slice(1, -1)}
        </Text>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <Text key={`${keyPrefix}-l-${partIndex++}`} style={{ textDecorationLine: 'underline' }}>
            {linkMatch[1]}
          </Text>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={`${keyPrefix}-t-${partIndex++}`}>{text.slice(lastIndex)}</Text>);
  }

  return (
    <Text style={{ color: textColor, lineHeight: 22 }}>
      {parts.length > 0 ? parts : text}
    </Text>
  );
}

export function ChatMarkdown({ content, textColor, isError }: ChatMarkdownProps) {
  const { theme } = useTheme();
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === 'code') {
          return <ChatCodeBlock key={key} code={block.code} language={block.language} />;
        }

        if (block.type === 'heading') {
          const size =
            block.level === 1
              ? theme.typography.fontSizes.lg
              : block.level === 2
                ? theme.typography.fontSizes.md
                : theme.typography.fontSizes.sm;
          return (
            <Text
              key={key}
              style={[
                styles.heading,
                {
                  color: isError ? theme.colors.error : textColor,
                  fontSize: size,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === 'quote') {
          return (
            <View
              key={key}
              style={[
                styles.quote,
                {
                  borderLeftColor: theme.colors.primary,
                  backgroundColor: `${theme.colors.primary}0A`,
                },
              ]}
            >
              {renderInlineText(block.text, textColor, key)}
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={key} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: textColor }]}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <View style={styles.listContent}>
                    {renderInlineText(item, textColor, `${key}-${itemIndex}`)}
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'table') {
          return (
            <ScrollViewHorizontalTable key={key} rows={block.rows} textColor={textColor} />
          );
        }

        return (
          <View key={key} style={styles.paragraph}>
            {renderInlineText(block.text, isError ? theme.colors.error : textColor, key)}
          </View>
        );
      })}
    </View>
  );
}

function ScrollViewHorizontalTable({
  rows,
  textColor,
}: {
  rows: string[][];
  textColor: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.table,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.tableRow,
            {
              backgroundColor:
                rowIndex === 0 ? theme.colors.surfaceSecondary : theme.colors.surfaceElevated,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          {row.map((cell, cellIndex) => (
            <Text
              key={`cell-${rowIndex}-${cellIndex}`}
              style={[
                styles.tableCell,
                {
                  color: textColor,
                  fontSize: theme.typography.fontSizes.xs,
                  fontWeight:
                    rowIndex === 0
                      ? theme.typography.fontWeights.semibold
                      : theme.typography.fontWeights.regular,
                },
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  paragraph: {
    marginBottom: 2,
  },
  heading: {
    lineHeight: 24,
    marginBottom: 2,
    marginTop: 4,
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    gap: 6,
    marginVertical: 2,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  listBullet: {
    lineHeight: 22,
    minWidth: 18,
  },
  listContent: {
    flex: 1,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 6,
    overflow: 'hidden',
  },
  tableRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    lineHeight: 18,
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
