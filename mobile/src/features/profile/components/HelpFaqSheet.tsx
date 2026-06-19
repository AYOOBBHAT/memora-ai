import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '../../../components/ui/BottomSheet';
import { useTheme } from '../../../theme/ThemeProvider';

interface HelpFaqSheetProps {
  visible: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    title: 'How to upload PDFs',
    body: 'On Home, tap a Quick Action or use the + button. Inside a collection, tap + and choose PDF. Memora extracts text and makes it searchable for AI chat.',
  },
  {
    title: 'How AI chat works',
    body: 'Memora searches your saved notes, PDFs, websites, and YouTube transcripts, then answers using that knowledge. Responses include citations so you can verify sources.',
  },
  {
    title: 'How Collections work',
    body: 'Collections organize your knowledge into focused workspaces. Add content to a collection, then use Chat with Collection to ask questions scoped to that set of documents.',
  },
  {
    title: 'How to contact support',
    body: 'Tap Contact Support on your Profile screen to email us. Include your device model and a short description of the issue for the fastest help.',
  },
];

export function HelpFaqSheet({ visible, onClose }: HelpFaqSheetProps) {
  const { theme } = useTheme();

  return (
    <BottomSheet title="Help & FAQ" visible={visible} onClose={onClose}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {FAQ_ITEMS.map((item) => (
          <View
            key={item.title}
            style={[
              styles.item,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.itemTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.itemBody,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.sm,
                  lineHeight: 20,
                },
              ]}
            >
              {item.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingBottom: 12,
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemTitle: {},
  itemBody: {},
});
