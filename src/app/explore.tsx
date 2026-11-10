
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

import { gifts } from '@/data/gifts';
import { Colors } from '@/constants/theme';
import { useShop } from '@/context/shop-context';

export default function GiftIdeasScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { addToCart, toggleWishlist, wishlistItems } = useShop();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
      <Text style={[styles.title, { color: colors.text }]}>
        Gift Ideas 🎁
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Discover something special for everyone
      </Text>

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.backgroundElement,
            color: colors.text,
            borderColor: colors.textSecondary,
          },
        ]}
        placeholder="Search gifts, categories..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <Text style={[styles.filterTitle, { color: colors.text }]}>
        Browse Categories
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;

          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected
                    ? '#8055D8'
                    : colors.backgroundElement,
                  borderColor: isSelected
                    ? '#8055D8'
                    : colors.textSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultHeader}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>
          {selectedCategory === 'All'
            ? 'Popular Gifts'
            : selectedCategory}
        </Text>

        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {filteredGifts.length} gifts found
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredGifts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No gifts found
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try another category or search.
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
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>

              <View style={styles.details}>
                <Text
                  style={[styles.name, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <Text
                  style={[styles.category, { color: colors.textSecondary }]}
                >
                  {item.category}
                </Text>

                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                <Text style={styles.price}>
                  LKR {item.price.toLocaleString()}
                </Text>

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
                    <Text style={styles.cartButtonText}>
                      + Add to Cart
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.wishlistButton}
                    onPress={() => toggleWishlist(item.id)}
                  >
                    <Text style={styles.wishlistButtonText}>
                      {isWishlisted ? '♥ Saved' : '♡ Wishlist'}
                    </Text>
                  </Pressable>
                </View>
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
    paddingTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 35,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  categoryContainer: {
    paddingRight: 12,
    paddingBottom: 5,
    gap: 9,
  },
  categoryButton: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultHeader: {
    marginTop: 20,
    marginBottom: 13,
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  resultCount: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 16,
    marginBottom: 13,
    gap: 12,
  },
  emojiContainer: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#8055D820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 34,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  category: {
    fontSize: 12,
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8055D8',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  cartButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 9,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wishlistButton: {
    borderWidth: 1,
    borderColor: '#8055D8',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 9,
  },
  wishlistButtonText: {
    color: '#8055D8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 45,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 17,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
