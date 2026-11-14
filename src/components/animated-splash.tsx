import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const sparkles = [
  { left: '12%', top: '22%', size: 20, color: '#FDE68A', icon: 'sparkles' },
  { right: '12%', top: '31%', size: 17, color: '#E9D5FF', icon: 'star' },
  { left: '18%', bottom: '19%', size: 15, color: '#FBCFE8', icon: 'star' },
  { right: '16%', bottom: '22%', size: 20, color: '#FDE68A', icon: 'sparkles' },
] as const;

export function AnimatedSplashOverlay() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  const [backgroundOpacity] = useState(() => new Animated.Value(0));
  const [giftOpacity] = useState(() => new Animated.Value(0));
  const [giftScale] = useState(() => new Animated.Value(0.72));
  const [giftEntranceY] = useState(() => new Animated.Value(24));
  const [giftFloatY] = useState(() => new Animated.Value(0));
  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [buttonOpacity] = useState(() => new Animated.Value(0));
  const [buttonTranslateY] = useState(() => new Animated.Value(12));
  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [sparkleOpacities] = useState(() =>
    sparkles.map(() => new Animated.Value(0))
  );
  const started = useRef(false);
  const navigated = useRef(false);
  const mounted = useRef(false);
  const introAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const sparkleAnimations = useMemo(
    () =>
      sparkleOpacities.map((opacity, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(1_250 + index * 170),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.delay(250),
            Animated.timing(opacity, {
              toValue: 0.18,
              duration: 650,
              useNativeDriver: true,
            }),
            Animated.delay(350 + index * 90),
          ])
        )
      ),
    [sparkleOpacities]
  );

  const floatAnimation = useMemo(
    () =>
      Animated.sequence([
        Animated.delay(1_250),
        Animated.loop(
          Animated.sequence([
            Animated.timing(giftFloatY, {
              toValue: -9,
              duration: 1_150,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(giftFloatY, {
              toValue: 0,
              duration: 1_150,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    [giftFloatY]
  );

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      introAnimation.current?.stop();
      floatAnimation.stop();
      sparkleAnimations.forEach((animation) => animation.stop());
    };
  }, [floatAnimation, sparkleAnimations]);

  const handleGoHome = useCallback(() => {
    if (!ready || !mounted.current || navigated.current) return;

    navigated.current = true;
    floatAnimation.stop();
    sparkleAnimations.forEach((animation) => animation.stop());
    router.replace('/(tabs)');

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished: fadeFinished }) => {
      if (fadeFinished && mounted.current) setVisible(false);
    });
  }, [floatAnimation, overlayOpacity, ready, router, sparkleAnimations]);

  const startAnimation = useCallback(() => {
    if (started.current) return;
    started.current = true;

    if (Platform.OS !== 'web') {
      try {
        SplashScreen.hide();
      } catch {
        // Continue with the in-app splash if native splash dismissal fails.
      }
    }

    sparkleAnimations.forEach((animation) => animation.start());
    floatAnimation.start();

    introAnimation.current = Animated.sequence([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(giftScale, {
          toValue: 1,
          friction: 5,
          tension: 66,
          useNativeDriver: true,
        }),
        Animated.timing(giftOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(giftEntranceY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1_100),
    ]);

    introAnimation.current.start(({ finished }) => {
      if (!finished || !mounted.current || navigated.current) return;

      setReady(true);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [
    backgroundOpacity,
    buttonOpacity,
    buttonTranslateY,
    floatAnimation,
    giftEntranceY,
    giftOpacity,
    giftScale,
    introAnimation,
    sparkleAnimations,
    taglineOpacity,
    titleOpacity,
  ]);

  if (!visible) return null;

  const artSize = Math.min(width * 0.82, height * 0.42, 330);
  const titleFontSize = Math.min(width * 0.105, 40);

  return (
    <Animated.View
      accessibilityLabel="GiftGenie. Make Every Gift Special. Loading home."
      onLayout={startAnimation}
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.gradient, { opacity: backgroundOpacity }]}
      />
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />

      <View style={styles.content}>
        <View
          style={[
            styles.illustration,
            { width: artSize, height: artSize, maxWidth: 360 },
          ]}
        >
          <View pointerEvents="none" style={styles.halo} />

          {sparkles.map((sparkle, index) => (
            <Animated.View
              key={`${sparkle.icon}-${index}`}
              pointerEvents="none"
              style={[
                styles.sparkle,
                sparkle,
                {
                  opacity: sparkleOpacities[index],
                  transform: [
                    {
                      scale: sparkleOpacities[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.55, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={sparkle.icon}
                size={sparkle.size}
                color={sparkle.color}
              />
            </Animated.View>
          ))}

          <Animated.View
            style={[
              styles.gift,
              {
                opacity: giftOpacity,
                transform: [
                  { translateY: Animated.add(giftEntranceY, giftFloatY) },
                  { scale: giftScale },
                ],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/giftgenie-logo.png')}
              contentFit="contain"
              accessibilityLabel="GiftGenie gift logo"
              style={{ width: artSize, height: artSize }}
            />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: titleOpacity, alignItems: 'center' }}>
          <Text style={[styles.title, { fontSize: titleFontSize }]}>GiftGenie</Text>
        </Animated.View>

        <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
          <Text style={styles.tagline}>Make Every Gift Special</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
            disabled={!ready}
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.homeButton,
              {
                width: Math.min(width - 56, 280),
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
            <View style={styles.homeButtonIcon}>
              <Ionicons name="arrow-forward" size={17} color="#5B21B6" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#4C1D95',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
    backgroundImage:
      'linear-gradient(145deg, #32105F 0%, #5B21B6 52%, #8B5CF6 100%)',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(221, 196, 255, 0.08)',
  },
  glowTop: {
    width: 300,
    height: 300,
    top: -170,
    right: -120,
  },
  glowBottom: {
    width: 250,
    height: 250,
    bottom: -150,
    left: -110,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  halo: {
    position: 'absolute',
    width: '76%',
    height: '76%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  sparkle: {
    position: 'absolute',
  },
  gift: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
    textShadowColor: 'rgba(37, 12, 76, 0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  tagline: {
    color: '#F1E8FF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  homeButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#24104A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  homeButtonText: {
    color: '#5B21B6',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  homeButtonIcon: {
    position: 'absolute',
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E8FF',
  },
});
