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
    () => ['All', ...Array.from(new Set(gifts.map((gift) => gift.category)))],
    []
  );

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const matchesSearch = gift.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        gift.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Gift Ideas 🎁
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Discover something special
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
        placeholder="Search gifts..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <Text style={[styles.filterTitle, { color: colors.text }]}>
        Categories
      </Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        style={styles.categoryList}
        renderItem={({ item }) => {
          const isSelected = selectedCategory === item;

          return (
            <Pressable
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected
                    ? '#8055D8'
                    : colors.backgroundElement,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
        {filteredGifts.length} gifts found
      </Text>

      <FlatList
        data={filteredGifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No gifts found. Try another search or category.
          </Text>
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
              <Text style={styles.emoji}>{item.emoji}</Text>

              <View style={styles.details}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {item.name}
                </Text>

                <Text style={[styles.category, { color: colors.textSecondary }]}>
                  {item.category}
                </Text>

                <Text style={styles.price}>
                  LKR {item.price.toLocaleString()}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.cartButton}
                    onPress={() => {
                      addToCart(item.id);
                      Alert.alert('Added to Cart', `${item.name} added successfully!`);
                    }}
                  >
                    <Text style={styles.cartButtonText}>+ Add to Cart</Text>
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
    paddingTop: 65,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
  },
  categoryList: {
    flexGrow: 0,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  resultCount: {
    fontSize: 13,
    marginTop: 16,
    marginBottom: 10,
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 38,
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  category: {
    fontSize: 13,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8055D8',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  cartButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  wishlistButtonText: {
    color: '#8055D8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
  },
});
