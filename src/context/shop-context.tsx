import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { gifts, type Gift } from '@/data/gifts';

type CartItem = {
  gift: Gift;
  quantity: number;
};

type ShopContextType = {
  cartItems: CartItem[];
  wishlistItems: Gift[];
  addToCart: (giftId: string) => void;
  removeFromCart: (giftId: string) => void;
  updateQuantity: (giftId: string, quantity: number) => void;
  toggleWishlist: (giftId: string) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = '@giftgenie_cart';
const WISHLIST_STORAGE_KEY = '@giftgenie_wishlist';

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedCart, savedWishlist] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(WISHLIST_STORAGE_KEY),
        ]);

        if (savedCart) {
          const parsedCart: unknown = JSON.parse(savedCart);

          if (
            parsedCart !== null &&
            typeof parsedCart === 'object' &&
            !Array.isArray(parsedCart)
          ) {
            setCart(parsedCart as Record<string, number>);
          }
        }

        if (savedWishlist) {
          const parsedWishlist: unknown = JSON.parse(savedWishlist);

          if (Array.isArray(parsedWishlist)) {
            setWishlist(
              parsedWishlist.filter(
                (id): id is string => typeof id === 'string'
              )
            );
          }
        }
      } catch (error) {
        console.error('Failed to load saved shopping data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSavedData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)),
          AsyncStorage.setItem(
            WISHLIST_STORAGE_KEY,
            JSON.stringify(wishlist)
          ),
        ]);
      } catch (error) {
        console.error('Failed to save shopping data:', error);
      }
    };

    saveData();
  }, [cart, wishlist, isLoaded]);

  const addToCart = (giftId: string) => {
    setCart((current) => ({
      ...current,
      [giftId]: (current[giftId] ?? 0) + 1,
    }));
  };

  const removeFromCart = (giftId: string) => {
    setCart((current) => {
      const updated = { ...current };
      delete updated[giftId];
      return updated;
    });
  };

  const updateQuantity = (giftId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(giftId);
      return;
    }

    setCart((current) => ({
      ...current,
      [giftId]: quantity,
    }));
  };

  const toggleWishlist = (giftId: string) => {
    setWishlist((current) =>
      current.includes(giftId)
        ? current.filter((id) => id !== giftId)
        : [...current, giftId]
    );
  };

  const clearCart = () => {
    setCart({});
  };

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const gift = gifts.find((item) => item.id === id);
          return gift ? { gift, quantity } : null;
        })
        .filter((item): item is CartItem => item !== null),
    [cart]
  );

  const wishlistItems = useMemo(
    () => gifts.filter((gift) => wishlist.includes(gift.id)),
    [wishlist]
  );

  const value: ShopContextType = {
    cartItems,
    wishlistItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleWishlist,
    clearCart,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error('useShop must be used inside ShopProvider');
  }

  return context;
}
