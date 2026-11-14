
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

import { gifts } from '@/data/gifts';
import { Colors } from '@/constants/theme';
import { useShop } from '@/context/shop-context';

const budgets = [1000, 2500, 5000, 7500, 10000];

export default function FindGiftsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { addToCart, toggleWishlist, wishlistItems } = useShop();

  const [selectedRecipient, setSelectedRecipient] = useState('All');
  const [selectedOccasion, setSelectedOccasion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxBudget, setMaxBudget] = useState(10000);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(gifts.map((gift) => gift.category)))],
    []
  );

  const recipients = useMemo(
    () => ['All', ...Array.from(new Set(gifts.flatMap((gift) => gift.recipients)))],
    []
  );

  const occasions = useMemo(
    () => ['All', ...Array.from(new Set(gifts.flatMap((gift) => gift.occasions)))],
    []
  );

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const matchesRecipient =
        selectedRecipient === 'All' ||
        gift.recipients.includes(selectedRecipient);

      const matchesOccasion =
        selectedOccasion === 'All' ||
        gift.occasions.includes(selectedOccasion);

      const matchesBudget = gift.price <= maxBudget;
      const searchText = search.trim().toLowerCase();
      const matchesSearch =
        gift.name.toLowerCase().includes(searchText) ||
        gift.category.toLowerCase().includes(searchText);
      const matchesCategory =
        selectedCategory === 'All' || gift.category === selectedCategory;

      return (
        matchesRecipient &&
        matchesOccasion &&
        matchesBudget &&
        matchesSearch &&
        matchesCategory
      );
    });
  }, [selectedRecipient, selectedOccasion, selectedCategory, maxBudget, search]);

  const renderOptions = (
    options: string[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => {
        const active = selected === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.optionButton,
              {
                backgroundColor: active ? '#8055D8' : colors.backgroundElement,
              },
            ]}
          >
            <Text
              style={{
                color: active ? '#FFFFFF' : colors.text,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Find the Perfect Gift
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tell us what you are looking for!
      </Text>

      <TextInput
        accessibilityLabel="Search gifts by name or category"
        style={[
          styles.searchInput,
          {
            color: colors.text,
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected,
          },
        ]}
        placeholder="Search gifts or categories"
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />

      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>
          Gift Category
        </Text>
        {renderOptions(categories, selectedCategory, setSelectedCategory)}
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>
          Who is the gift for?
        </Text>

        {renderOptions(
          recipients,
          selectedRecipient,
          setSelectedRecipient
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>
          Select an Occasion
        </Text>

        {renderOptions(
          occasions,
          selectedOccasion,
          setSelectedOccasion
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>
          Your Maximum Budget
        </Text>

        <Text style={styles.budgetValue}>
          LKR {maxBudget.toLocaleString()}
        </Text>

        <View style={styles.budgetOptions}>
          {budgets.map((budget) => {
            const active = maxBudget === budget;

            return (
              <Pressable
                key={budget}
                onPress={() => setMaxBudget(budget)}
                style={[
                  styles.budgetButton,
                  {
                    backgroundColor: active
                      ? '#8055D8'
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  {budget === 10000
                    ? '10,000+'
                    : budget.toLocaleString()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>
          Recommended Gifts
        </Text>

        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {filteredGifts.length} found
        </Text>
      </View>

      {filteredGifts.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Text style={styles.emptyEmoji}>🎁</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No matching gifts
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Try increasing your budget or changing your filters.
          </Text>
          <Pressable
            onPress={() => {
              setSelectedRecipient('All');
              setSelectedOccasion('All');
              setSelectedCategory('All');
              setSearch('');
              setMaxBudget(10000);
            }}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </Pressable>
        </View>
      ) : (
        filteredGifts.map((item) => {
          const isWishlisted = wishlistItems.some(
            (gift) => gift.id === item.id
          );

          return (
            <View
              key={item.id}
              style={[
                styles.giftCard,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={styles.giftEmoji}>{item.emoji}</Text>

              <View style={styles.giftDetails}>
                <Text style={[styles.giftName, { color: colors.text }]}>
                  {item.name}
                </Text>

                <Text style={[styles.giftCategory, { color: colors.textSecondary }]}>
                  {item.category}
                </Text>

                <Text style={styles.giftPrice}>
                  LKR {item.price.toLocaleString()}
                </Text>

                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.cartButton}
                    onPress={() => {
                      addToCart(item.id);
                      Alert.alert(
                        'Added to Cart',
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
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 65,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 22,
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8055D8',
    marginBottom: 12,
  },
  budgetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetButton: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  resultCount: {
    fontSize: 13,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    marginBottom: 13,
  },
  giftEmoji: {
    fontSize: 38,
    marginRight: 14,
  },
  giftDetails: {
    flex: 1,
  },
  giftName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  giftCategory: {
    fontSize: 13,
    marginTop: 4,
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8055D8',
    marginTop: 6,
  },
  description: {
    fontSize: 12,
    marginTop: 5,
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
  emptyCard: {
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
