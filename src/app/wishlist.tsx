import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useShop } from '@/context/shop-context';

export default function WishlistScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { wishlistItems, toggleWishlist, addToCart } = useShop();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        My Wishlist ♥
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {wishlistItems.length} favourite gifts saved
      </Text>

      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>♡</Text>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your wishlist is empty
          </Text>

          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Explore Gift Ideas and save your favourite gifts here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
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
                      Alert.alert(
                        'Added to Cart',
                        `${item.name} added successfully!`
                      );
                    }}
                  >
                    <Text style={styles.cartButtonText}>+ Add to Cart</Text>
                  </Pressable>

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => toggleWishlist(item.id)}
                  >
                    <Text style={styles.removeButtonText}>♥ Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}
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
    marginBottom: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 70,
    color: '#8055D8',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
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
  removeButton: {
    borderWidth: 1,
    borderColor: '#E05252',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  removeButtonText: {
    color: '#E05252',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
