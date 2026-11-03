import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  message: string;
};

export function FeaturePlaceholder({
  title,
  subtitle,
  emoji,
  message,
}: Props) {
  const isDark = useColorScheme() === 'dark';

  const colors = {
    background: isDark ? '#15121D' : '#FAF8FF',
    surface: isDark ? '#241F30' : '#FFFFFF',
    text: isDark ? '#F7F2FF' : '#211A32',
    secondary: isDark ? '#B9ADC9' : '#827991',
    primary: '#8055D8',
    border: isDark ? '#393044' : '#EEE8F6',
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>
            GiftGenie
          </Text>
        </View>

        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {subtitle}
          </Text>

          <Text style={[styles.message, { color: colors.secondary }]}>
            {message}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 22 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 35,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#8055D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  brandName: { fontSize: 20, fontWeight: '800' },
  contentCard: {
    flex: 1,
    maxHeight: 380,
    borderRadius: 25,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCircle: {
    width: 105,
    height: 105,
    borderRadius: 35,
    backgroundColor: '#F1E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  emoji: { fontSize: 53 },
  title: {
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  message: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 15,
  },
});