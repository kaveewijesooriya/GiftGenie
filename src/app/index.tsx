import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const occasions = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'birthday', name: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', name: 'Anniversary', emoji: '💝' },
  { id: 'wedding', name: 'Wedding', emoji: '💍' },
  { id: 'graduation', name: 'Graduation', emoji: '🎓' },
];

const gifts = [
  {
    id: '1',
    name: 'Elegant Gift Box',
    category: 'Birthday',
    price: 2500,
    emoji: '🎁',
    color: '#F1E5FF',
  },
  {
    id: '2',
    name: 'Rose Bouquet',
    category: 'Anniversary',
    price: 3500,
    emoji: '💐',
    color: '#FFE5EB',
  },
  {
    id: '3',
    name: 'Luxury Watch',
    category: 'Birthday',
    price: 8500,
    emoji: '⌚',
    color: '#E3EDFF',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [search, setSearch] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');

  const colors = {
    background: isDark ? '#15121D' : '#FAF8FF',
    surface: isDark ? '#241F30' : '#FFFFFF',
    text: isDark ? '#F7F2FF' : '#211A32',
    secondary: isDark ? '#B9ADC9' : '#827991',
    primary: '#8055D8',
    border: isDark ? '#393044' : '#EEE8F6',
  };

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch = gift.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesOccasion =
      selectedOccasion === 'all' ||
      gift.category.toLowerCase() === selectedOccasion;

    return matchesSearch && matchesOccasion;
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>

            <View>
              <Text style={[styles.brandName, { color: colors.text }]}>
                GiftGenie
              </Text>
              <Text style={[styles.brandTagline, { color: colors.secondary }]}>
                Make every moment special
              </Text>
            </View>
          </View>

          <View style={[styles.profileButton, { backgroundColor: colors.surface }]}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.greeting, { color: colors.secondary }]}>
            HELLO, GIFT GIVER 👋
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>
            Find the perfect{'\n'}
            <Text style={{ color: colors.primary }}>gift for everyone.</Text>
          </Text>

          <Text style={[styles.description, { color: colors.secondary }]}>
            Thoughtful gifts make unforgettable memories.
            Let’s find something special!
          </Text>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for gift ideas..."
            placeholderTextColor={colors.secondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={{ color: colors.secondary, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Occasion categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Shop by occasion
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
              Find gifts for every moment
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {occasions.map((occasion) => {
              const selected = selectedOccasion === occasion.id;

              return (
                <Pressable
                  key={occasion.id}
                  onPress={() => setSelectedOccasion(occasion.id)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{occasion.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: selected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {occasion.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured gifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Popular gift ideas
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
              A little inspiration goes a long way
            </Text>
          </View>

          {filteredGifts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No gifts found
              </Text>
              <Text style={{ color: colors.secondary }}>
                Try another search or occasion.
              </Text>
            </View>
          ) : (
            <View style={styles.giftGrid}>
              {filteredGifts.map((gift) => (
                <Pressable
                  key={gift.id}
                  style={({ pressed }) => [
                    styles.giftCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.giftImage,
                      { backgroundColor: gift.color },
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  </View>

                  <View style={styles.giftInfo}>
                    <Text style={[styles.giftCategory, { color: colors.secondary }]}>
                      {gift.category}
                    </Text>

                    <Text
                      style={[styles.giftName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {gift.name}
                    </Text>

                    <Text style={[styles.giftPrice, { color: colors.primary }]}>
                      LKR {gift.price.toLocaleString('en-LK')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Bottom message */}
        <View style={styles.bottomMessage}>
          <Text style={styles.bottomEmoji}>💜</Text>
          <Text style={[styles.bottomText, { color: colors.secondary }]}>
            Every gift tells a story. Make yours memorable.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#8055D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 21,
  },
  welcomeSection: {
    marginTop: 35,
    marginBottom: 23,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: -1,
  },
  description: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  searchBox: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 11,
  },
  searchIcon: {
    fontSize: 17,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 5,
  },
  categoryList: {
    gap: 10,
    paddingBottom: 3,
  },
  categoryItem: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
    minWidth: 82,
  },
  categoryEmoji: {
    fontSize: 23,
    marginBottom: 7,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },
  giftCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 19,
    borderWidth: 1,
    overflow: 'hidden',
  },
  giftImage: {
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 57,
  },
  giftInfo: {
    padding: 12,
  },
  giftCategory: {
    fontSize: 10,
    fontWeight: '600',
  },
  giftName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  giftPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyBox: {
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomMessage: {
    alignItems: 'center',
    marginTop: 35,
    gap: 8,
  },
  bottomEmoji: {
    fontSize: 23,
  },
  bottomText: {
    fontSize: 11,
    textAlign: 'center',
  },
});