
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { gifts } from '@/data/gifts';
import { useShop } from '@/context/shop-context';

export default function GiftDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { addToCart, toggleWishlist, wishlistItems } = useShop();

  const gift = gifts.find((item) => item.id === id);

  const isWishlisted = wishlistItems.some(
    (item) => item.id === id
  );

  const [added, setAdded] = useState(false);

  const surface = colors.backgroundElement;
  const muted = colors.textSecondary;

  if (!gift) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.notFound}>
          <Ionicons name="gift-outline" size={65} color="#8055D8" />
          <Text style={[styles.notFoundTitle, { color: colors.text }]}>
            Gift Not Found
          </Text>
          <Text style={[styles.description, { color: muted }]}>
            Sorry, this gift could not be found.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addToCart(gift.id);
    setAdded(true);

    Alert.alert(
      'Added to Cart',
      `${gift.name} added successfully!`
    );
  };

  const handleWishlist = () => {
    toggleWishlist(gift.id);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color={colors.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Gift Details
          </Text>

          <Pressable
            style={[styles.iconButton, { backgroundColor: surface }]}
            onPress={handleWishlist}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={23}
              color={isWishlisted ? '#E84C83' : '#8055D8'}
            />
          </Pressable>
        </View>

        {/* Gift Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#8055D8" />
            <Text style={styles.heroBadgeText}>SPECIAL GIFT</Text>
          </View>

          <View style={styles.giftCircle}>
            <Text style={styles.giftEmoji}>{gift.emoji}</Text>
          </View>

          <Text style={styles.heroCaption}>
            A little happiness, wrapped with love
          </Text>
        </View>

        {/* Gift Information */}
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {gift.category.toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.giftId, { color: muted }]}>
              {gift.id}
            </Text>
          </View>

          <Text style={[styles.giftName, { color: colors.text }]}>
            {gift.name}
          </Text>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>PRICE</Text>
              <Text style={styles.price}>
                LKR {gift.price.toLocaleString('en-LK')}
              </Text>
            </View>

            <View style={styles.priceIcon}>
              <Ionicons name="pricetag" size={25} color="#8055D8" />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About This Gift
            </Text>

            <Text style={[styles.descriptionText, { color: muted }]}>
              {gift.description}
            </Text>
          </View>

          {/* Occasions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Perfect For
            </Text>

            <View style={styles.tags}>
              {gift.occasions.map((occasion) => (
                <View key={occasion} style={styles.tag}>
                  <Ionicons name="calendar-outline" size={14} color="#8055D8" />
                  <Text style={styles.tagText}>{occasion}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recipients */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Suitable For
            </Text>

            <View style={styles.tags}>
              {gift.recipients.map((recipient) => (
                <View key={recipient} style={styles.tag}>
                  <Ionicons name="person-outline" size={14} color="#8055D8" />
                  <Text style={styles.tagText}>{recipient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Wishlist Status */}
          {isWishlisted && (
            <View style={styles.savedNotice}>
              <Ionicons name="heart" size={17} color="#E84C83" />
              <Text style={styles.savedText}>
                This gift is saved to your Wishlist
              </Text>
            </View>
          )}

          {/* Buttons */}
          <Pressable
            style={styles.cartButton}
            onPress={handleAddToCart}
          >
            <Ionicons name="bag-add-outline" size={21} color="#FFFFFF" />
            <Text style={styles.cartButtonText}>
              {added ? 'Add Another to Cart' : 'Add to Cart'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.wishlistButton}
            onPress={handleWishlist}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color="#8055D8"
            />
            <Text style={styles.wishlistButtonText}>
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Ionicons name="gift-outline" size={18} color="#8055D8" />
            <Text style={[styles.footerText, { color: muted }]}>
              Made for special moments with GiftGenie
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  iconButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 285,
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 28,
    backgroundColor: '#8055D8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: -80,
    right: -65,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -85,
    left: -55,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 17,
  },
  heroBadgeText: {
    color: '#8055D8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  giftCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.19)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: {
    fontSize: 82,
  },
  heroCaption: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 15,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 35,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#EFE8FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  categoryText: {
    color: '#8055D8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  giftId: {
    fontSize: 12,
    fontWeight: '600',
  },
  giftName: {
    fontSize: 27,
    fontWeight: '900',
    marginTop: 13,
  },
  priceCard: {
    backgroundColor: '#F3EEFF',
    borderRadius: 19,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: '#8055D8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  price: {
    color: '#6840C1',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },
  priceIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 23,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tagText: {
    color: '#6840C1',
    fontSize: 12,
    fontWeight: '700',
  },
  savedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F5',
    padding: 13,
    borderRadius: 12,
    marginTop: 22,
  },
  savedText: {
    color: '#D83D77',
    fontSize: 12,
    fontWeight: '700',
  },
  cartButton: {
    height: 55,
    backgroundColor: '#8055D8',
    borderRadius: 16,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  wishlistButton: {
    height: 53,
    borderWidth: 1.5,
    borderColor: '#8055D8',
    borderRadius: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  wishlistButtonText: {
    color: '#8055D8',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  notFoundTitle: {
    fontSize: 23,
    fontWeight: '900',
    marginTop: 18,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#8055D8',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
