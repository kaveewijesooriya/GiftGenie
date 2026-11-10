
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { gifts } from '@/data/gifts';

const occasions = [
  { id: 'all', name: 'All Gifts', emoji: '✨' },
  { id: 'Birthday', name: 'Birthday', emoji: '🎂' },
  { id: 'Anniversary', name: 'Anniversary', emoji: '💝' },
  { id: 'Wedding', name: 'Wedding', emoji: '💍' },
  { id: 'Graduation', name: 'Graduation', emoji: '🎓' },
  { id: 'Christmas', name: 'Christmas', emoji: '🎄' },
];

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const [search, setSearch] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');

  const colors = {
    background: theme.background,
    surface: isDark ? '#252238' : '#FFFFFF',
    text: theme.text,
    secondary: isDark ? '#B9ADC9' : '#827991',
    primary: '#8055D8',
    border: isDark ? '#393044' : '#EEE8F6',
    softPurple: isDark ? '#302443' : '#F0E8FF',
  };

  const filteredGifts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return gifts.filter((gift) => {
      const matchesSearch =
        gift.name.toLowerCase().includes(searchText) ||
        gift.category.toLowerCase().includes(searchText) ||
        gift.description.toLowerCase().includes(searchText);

      const matchesOccasion =
        selectedOccasion === 'all' ||
        gift.occasions.some(
          (item) =>
            item.toLowerCase() === selectedOccasion.toLowerCase()
        );

      return matchesSearch && matchesOccasion;
    });
  }, [search, selectedOccasion]);

  const popularGifts = filteredGifts.slice(0, 6);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Ionicons name="gift" size={25} color="#FFFFFF" />
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

          <Pressable
            onPress={() => router.push('/cart')}
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="bag-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* Welcome Banner */}
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>
                YOUR GIFTING PARTNER
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Find the perfect{'\n'}gift for everyone!
            </Text>

            <Text style={styles.heroDescription}>
              Beautiful gifts. Special moments.{'\n'}
              Unforgettable memories.
            </Text>

            <Pressable
              onPress={() => router.push('/find')}
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>Find a Gift</Text>
              <Ionicons name="arrow-forward" size={17} color="#8055D8" />
            </Pressable>
          </View>

          <View style={styles.heroDecoration}>
            <Text style={styles.heroGift}>🎁</Text>
            <Text style={styles.heroHeart}>💜</Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={21}
            color={colors.secondary}
          />

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
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.secondary}
              />
            </Pressable>
          )}
        </View>

        {/* Shop by Occasion */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Shop by Occasion
          </Text>

          <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
            Gifts for every special moment
          </Text>

          <View style={styles.categoryGrid}>
            {occasions.map((occasion) => {
              const selected = selectedOccasion === occasion.id;

              return (
                <Pressable
                  key={occasion.id}
                  onPress={() => setSelectedOccasion(occasion.id)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.surface,
                      borderColor: selected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>
                    {occasion.emoji}
                  </Text>

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
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Explore GiftGenie
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => router.push('/explore')}
              style={[
                styles.actionCard,
                { backgroundColor: colors.softPurple },
              ]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="gift-outline" size={23} color="#8055D8" />
              </View>

              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Gift Ideas
              </Text>

              <Text style={[styles.actionSubtitle, { color: colors.secondary }]}>
                Explore gifts
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/planner')}
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark ? '#30243B' : '#FCEBF2',
                },
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor: isDark ? '#493047' : '#F9DCE8',
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={23}
                  color="#D65B91"
                />
              </View>

              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Gift Planner
              </Text>

              <Text style={[styles.actionSubtitle, { color: colors.secondary }]}>
                Plan special days
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Popular Gifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Popular Gift Ideas
              </Text>

              <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
                A little inspiration goes a long way
              </Text>
            </View>

            <Pressable onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>See All →</Text>
            </Pressable>
          </View>

          <Text style={[styles.resultCount, { color: colors.secondary }]}>
            {filteredGifts.length} gifts found
          </Text>

          {popularGifts.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={styles.emptyEmoji}>🎁</Text>

              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No gifts found
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  { color: colors.secondary },
                ]}
              >
                Try another search or occasion.
              </Text>

              <Pressable
                onPress={() => {
                  setSearch('');
                  setSelectedOccasion('all');
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Clear Filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.giftGrid}>
              {popularGifts.map((gift) => (
                <Pressable
                  key={gift.id}
                  onPress={() => router.push('/explore')}
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
                      { backgroundColor: colors.softPurple },
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>

                    <View style={styles.giftTag}>
                      <Text style={styles.giftTagText}>POPULAR</Text>
                    </View>
                  </View>

                  <View style={styles.giftInfo}>
                    <Text
                      style={[
                        styles.giftCategory,
                        { color: colors.secondary },
                      ]}
                    >
                      {gift.category}
                    </Text>

                    <Text
                      style={[styles.giftName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {gift.name}
                    </Text>

                    <Text style={styles.giftPrice}>
                      LKR {gift.price.toLocaleString('en-LK')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Message */}
        <View
          style={[
            styles.bottomMessage,
            { backgroundColor: colors.softPurple },
          ]}
        >
          <Text style={styles.bottomEmoji}>💜</Text>

          <View style={{ flex: 1 }}>
            <Text style={[styles.bottomTitle, { color: colors.text }]}>
              Make Someone Smile!
            </Text>

            <Text style={[styles.bottomText, { color: colors.secondary }]}>
              Every gift tells a story. Make yours memorable.
            </Text>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.secondary }]}>
          Made with love by GiftGenie ✨
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 23,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#8055D8',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    minHeight: 240,
    borderRadius: 24,
    backgroundColor: '#8055D8',
    padding: 21,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  heroContent: {
    zIndex: 2,
    alignItems: 'flex-start',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 33,
    letterSpacing: -0.7,
  },
  heroDescription: {
    color: '#F0E9FF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 17,
  },
  heroButtonText: {
    color: '#8055D8',
    fontSize: 12,
    fontWeight: '800',
  },
  heroDecoration: {
    position: 'absolute',
    right: 10,
    bottom: 26,
    zIndex: 1,
    transform: [{ rotate: '-10deg' }],
  },
  heroGift: {
    fontSize: 78,
  },
  heroHeart: {
    fontSize: 28,
    position: 'absolute',
    top: -12,
    right: -2,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -65,
    top: -70,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: 45,
    bottom: -75,
  },
  searchBox: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 11,
    marginTop: 21,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  categoryItem: {
    width: '31%',
    minHeight: 91,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 25,
    marginBottom: 7,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  actionCard: {
    flex: 1,
    borderRadius: 17,
    padding: 14,
    minHeight: 120,
  },
  actionIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#E5D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionSubtitle: {
    fontSize: 10,
    marginTop: 4,
  },
  seeAll: {
    color: '#8055D8',
    fontSize: 12,
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 11,
    marginTop: -7,
    marginBottom: 12,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  giftCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
  },
  giftImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  giftEmoji: {
    fontSize: 53,
  },
  giftTag: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  giftTagText: {
    color: '#8055D8',
    fontSize: 8,
    fontWeight: '900',
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
    color: '#8055D8',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
  emptyBox: {
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#8055D8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bottomMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 16,
    borderRadius: 17,
    marginTop: 29,
  },
  bottomEmoji: {
    fontSize: 28,
  },
  bottomTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomText: {
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 23,
  },
});
