import React, {
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';

export default function SplashScreen({
  onFinish,
}) {
  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const scale = useRef(
    new Animated.Value(0.5)
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),

        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(1500),

      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logo,
          {
            opacity: opacity,
            transform: [
              {
                scale: scale,
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>
          VidaVida
        </Text>

        <Text style={styles.subtitle}>
          Aplicación multifuncional
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    alignItems: 'center',
  },

  title: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#ddd',
    fontSize: 16,
    marginTop: 10,
  },
});