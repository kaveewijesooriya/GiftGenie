
import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { gifts } from '@/data/gifts';
import { Colors } from '@/constants/theme';
import { useShop } from '@/context/shop-context';

export default function GiftIdeasScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const { addToCart, toggleWishlist, wishlistItems } = useShop();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const primary = '#8055D8';
  const surface = isDark ? '#252238' : '#FFFFFF';
  const border = isDark ? '#393044' : '#EEE8F6';
  const muted = colors.textSecondary;

  // Open Gift Details Screen
  const openGiftDetails = (giftId: string) => {
    router.push({
      pathname: '/gift-details/[id]',
      params: { id: giftId },
    });
  };

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(gifts.map((gift) => gift.category).filter(Boolean))
      ),
    ],
    []
  );

  const filteredGifts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return gifts.filter((gift) => {
      const matchesSearch =
        gift.name.toLowerCase().includes(searchText) ||
        gift.category.toLowerCase().includes(searchText) ||
        gift.description.toLowerCase().includes(searchText);

      const matchesCategory =
        selectedCategory === 'All' ||
        gift.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const renderHeader = () => (
    <View>
      {/* Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.heroCircleOne} />
        <View style={styles.heroCircleTwo} />

        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>SPECIAL GIFT COLLECTION</Text>
          </View>

          <Text style={styles.heroTitle}>
            Find a Gift,{'\n'}Share Happiness!
          </Text>

          <Text style={styles.heroSubtitle}>
            Discover thoughtful gifts for your favourite people.
          </Text>
        </View>

        <Text style={styles.heroEmoji}>🎁</Text>
        <Text style={styles.heroHeart}>💜</Text>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: surface,
            borderColor: border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={21} color={muted} />

        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search gifts, categories..."
          placeholderTextColor={muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={muted} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Browse Categories
          </Text>
          <Text style={[styles.sectionSubtitle, { color: muted }]}>
            Explore gifts by category
          </Text>
        </View>
        <Text style={styles.sectionEmoji}>🛍️</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => {
          const selected = selectedCategory === category;

          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selected ? primary : surface,
                  borderColor: selected ? primary : border,
                },
              ]}
            >
              {category === 'All' && (
                <Ionicons
                  name="apps-outline"
                  size={15}
                  color={selected ? '#FFFFFF' : primary}
                />
              )}

              <Text
                style={[
                  styles.categoryButtonText,
                  { color: selected ? '#FFFFFF' : colors.text },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultHeader}>
        <View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {selectedCategory === 'All'
              ? 'Popular Gift Ideas'
              : selectedCategory}
          </Text>

          <Text style={[styles.resultSubtitle, { color: muted }]}>
            Find something special today
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {filteredGifts.length} Gifts
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <FlatList
        data={filteredGifts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: surface },
            ]}
          >
            <Text style={styles.emptyEmoji}>🎁</Text>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No gifts found
            </Text>

            <Text style={[styles.emptyText, { color: muted }]}>
              Try another category or search for something else.
            </Text>

            <Pressable
              style={styles.resetButton}
              onPress={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
            >
              <Text style={styles.resetButtonText}>Show All Gifts</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const isWishlisted = wishlistItems.some(
            (gift) => gift.id === item.id
          );

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: surface,
                  borderColor: border,
                },
              ]}
            >
              {/* Gift Visual */}
              <View style={styles.giftVisual}>
                <Pressable
                  style={styles.giftVisualContent}
                  onPress={() => openGiftDetails(item.id)}
                >
                  <View style={styles.giftVisualCircle}>
                    <Text style={styles.giftEmoji}>{item.emoji}</Text>
                  </View>

                  <View style={styles.visualLabel}>
                    <Text style={styles.visualLabelText}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>

                {/* Wishlist Button */}
                <Pressable
                  onPress={() => toggleWishlist(item.id)}
                  style={styles.heartButton}
                >
                  <Ionicons
                    name={isWishlisted ? 'heart' : 'heart-outline'}
                    size={21}
                    color={isWishlisted ? '#E84C83' : '#8055D8'}
                  />
                </Pressable>
              </View>

              {/* Gift Details */}
              <View style={styles.details}>
                <Pressable onPress={() => openGiftDetails(item.id)}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.name, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </View>

                  <Text
                    style={[styles.description, { color: muted }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </Pressable>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={[styles.priceLabel, { color: muted }]}>
                      PRICE
                    </Text>
                    <Text style={styles.price}>
                      LKR {item.price.toLocaleString('en-LK')}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.cartButton}
                      onPress={() => {
                        addToCart(item.id);
                        Alert.alert(
                          'Added to Cart 🎉',
                          `${item.name} added successfully!`
                        );
                      }}
                    >
                      <Ionicons
                        name="bag-add-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.cartButtonText}>Add</Text>
                    </Pressable>
                  </View>
                </View>

                {isWishlisted && (
                  <Text style={styles.savedText}>
                    <Ionicons name="heart" size={12} color="#E84C83" />
                    {' '}Saved to Wishlist
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 35,
  },
  hero: {
    minHeight: 190,
    backgroundColor: '#8055D8',
    borderRadius: 23,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  heroContent: {
    zIndex: 2,
    maxWidth: '75%',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 13,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#F0E9FF',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },
  heroEmoji: {
    position: 'absolute',
    right: 7,
    bottom: 24,
    fontSize: 76,
    transform: [{ rotate: '-12deg' }],
  },
  heroHeart: {
    position: 'absolute',
    right: 23,
    top: 22,
    fontSize: 25,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -50,
    top: -65,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: 65,
    bottom: -65,
  },
  searchBox: {
    height: 53,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionEmoji: {
    fontSize: 26,
  },
  categoryContainer: {
    gap: 9,
    paddingBottom: 4,
  },
  categoryButton: {
    minHeight: 39,
    paddingHorizontal: 15,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  resultSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#F0E8FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countText: {
    color: '#8055D8',
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    borderRadius: 19,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  giftVisual: {
    height: 145,
    backgroundColor: '#F0E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  giftVisualContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftVisualCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 58,
  },
  visualLabel: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  visualLabelText: {
    color: '#8055D8',
    fontSize: 8,
    fontWeight: '900',
  },
  heartButton: {
    position: 'absolute',
    right: 12,
    top: 11,
    width: 35,
    height: 35,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    padding: 15,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },
  priceLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  price: {
    color: '#8055D8',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8055D8',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 11,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  savedText: {
    color: '#E84C83',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 12,
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 17,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
