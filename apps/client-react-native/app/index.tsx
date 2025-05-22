// apps/client-react-native/app/index.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import BgImage from '../assets/images/bgImage.svg';
import Logo from '../assets/images/logo.svg';
import SplashImage from '../assets/images/splashImag.svg';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const WHITE_HEIGHT = 240;
const GAP          = 10;
const TIMEOUT_MS   = 2_000;

export default function WelcomeScreen() {
  const router      = useRouter();
  const splashY     = useRef(new Animated.Value(0)).current;
  const buttonsY    = useRef(new Animated.Value(WHITE_HEIGHT)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // novos anims
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const bobAnim     = useRef(new Animated.Value(0)).current;

  // componentes Animated
  const AnimatedLogo       = Animated.createAnimatedComponent(Logo);
  const AnimatedSplashImg  = Animated.createAnimatedComponent(SplashImage);

  useEffect(() => {
    // animação de entrada + logo fade
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashY, {
          toValue: -(WHITE_HEIGHT + GAP),
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, TIMEOUT_MS);

    // animação infinita de pulse + bob
    Animated.loop(
      Animated.parallel([
        // pulse: vai de 1→1.1→1
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ]),        
      ])
    ).start();

    return () => clearTimeout(timer);
  }, [splashY, buttonsY, logoOpacity, pulseAnim, bobAnim]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.splash,
          { transform: [{ translateY: splashY }] },
        ]}
      >
        {/* background full */}
        <BgImage
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* imagem pulsante + “bob” */}
        <AnimatedSplashImg
          width={400}
          height={400}
          style={[
            styles.splashImg,
            {
              transform: [
                { scale: pulseAnim },
                { translateY: bobAnim },
              ],
            },
          ]}
        />

        {/* logo fade-in */}
        <AnimatedLogo
          width={200}
          height={150}
          style={[
            styles.logo,
            { opacity: logoOpacity },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonsWrapper,
          { transform: [{ translateY: buttonsY }] },
        ]}
      >
        <View style={styles.buttonsBox}>
          <Button
            onPress={() => router.push('/login')}
            bgColor="#F0F0F0"
            textStyle={{ color: '#000' }}
            style={styles.button}
          >
            Entrar
          </Button>
          <Button
            onPress={() => router.push('/register')}
            bgColor="#000"
            style={[styles.button, { marginTop: 12 }]}
          >
            Cadastrar-se
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFA600',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  splashImg: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.45, 
    alignSelf: 'center',
  },
  logo: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  buttonsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  buttonsBox: {
    width: '100%',
    height: WHITE_HEIGHT,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 20,
  },
});
