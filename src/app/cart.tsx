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

export default function CartScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { cartItems, removeFromCart, updateQuantity, clearCart } = useShop();

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.gift.price * item.quantity,
    0
  );

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all gifts from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>My Cart 🛒</Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {cartItems.length} different gifts in your cart
      </Text>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Explore gift ideas and add something special!
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.gift.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Text style={styles.emoji}>{item.gift.emoji}</Text>

                <View style={styles.details}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {item.gift.name}
                  </Text>

                  <Text style={[styles.price, { color: '#8055D8' }]}>
                    LKR {item.gift.price.toLocaleString()}
                  </Text>

                  <View style={styles.quantityRow}>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.gift.id, item.quantity - 1)
                      }
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </Pressable>

                    <Text style={[styles.quantity, { color: colors.text }]}>
                      {item.quantity}
                    </Text>

                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.gift.id, item.quantity + 1)
                      }
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.subtotal, { color: colors.text }]}>
                    Subtotal: LKR{' '}
                    {(item.gift.price * item.quantity).toLocaleString()}
                  </Text>

                  <Pressable
                    onPress={() => removeFromCart(item.gift.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />

          <View
            style={[
              styles.summary,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total Price
            </Text>

            <Text style={styles.totalPrice}>
              LKR {totalPrice.toLocaleString()}
            </Text>

            <Pressable style={styles.clearButton} onPress={handleClearCart}>
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </Pressable>
          </View>
        </>
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
    fontSize: 65,
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
    paddingBottom: 15,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 38,
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 15,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#8055D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtotal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 9,
  },
  removeButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeText: {
    color: '#E05252',
    fontSize: 13,
    fontWeight: '600',
  },
  summary: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalPrice: {
    color: '#8055D8',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  clearButton: {
    backgroundColor: '#E05252',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
