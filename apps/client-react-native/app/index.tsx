// apps/client-react-native/app/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  LayoutChangeEvent,
} from 'react-native';
import { Button } from '../components/Button';
import BgImage from '../assets/images/bgImage.svg';
import Logo from '../assets/images/logo.svg';
import SplashImage from '../assets/images/splashImag.svg';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP        = 10;
const TIMEOUT_MS = 2000;

export default function WelcomeScreen() {
  // habilita LayoutAnimation no Android
  if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [view, setView] = useState<'buttons' | 'login' | 'register'>(
    'buttons'
  );
  const [boxH, setBoxH] = useState(0);
  const [imgTop, setImgTop] = useState(SCREEN_HEIGHT * 0.3);

  const splashY     = useRef(new Animated.Value(0)).current;
  const buttonsY    = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const entryStartedRef = useRef(false);
  const prevViewRef     = useRef(view);

  // inicia loop de pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // animação inicial + move SplashImage após TIMEOUT_MS
  useEffect(() => {
    if (boxH > 0 && !entryStartedRef.current) {
      buttonsY.setValue(boxH);
      entryStartedRef.current = true;

      const timer = setTimeout(() => {
        setImgTop(SCREEN_HEIGHT * 0.45);
        Animated.parallel([
          Animated.timing(splashY, {
            toValue: -(boxH + GAP),
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

      return () => clearTimeout(timer);
    }
  }, [boxH]);

  // reposiciona splash quando altura muda em troca de view
  const onBoxLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (!h) return;
    setBoxH(h);

    if (entryStartedRef.current && prevViewRef.current !== view) {
      Animated.timing(splashY, {
        toValue: -(h + GAP),
        duration: 300,
        useNativeDriver: true,
      }).start();
      prevViewRef.current = view;
    }
  };

  // handlers de view com LayoutAnimation
  const goLogin = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView('login');
  };
  const goRegister = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView('register');
  };
  const goButtons = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView('buttons');
  };

  return (
    <View style={styles.root}>
      {/* SPLASH AMARELO */}
      <Animated.View
        style={[styles.splash, { transform: [{ translateY: splashY }] }]}
      >
        <BgImage
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />

        {view === 'buttons' && (
          <Animated.View
            style={[
              styles.splashImg,
              {
                top: imgTop,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <SplashImage width={400} height={400} />
          </Animated.View>
        )}

        <Animated.View style={[styles.logo, { opacity: logoOpacity }]}>
          <Logo width={200} height={150} />
        </Animated.View>
      </Animated.View>

      {/* CAIXA BRANCA + KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'position'}
        keyboardVerticalOffset={-20}
        style={styles.boxWrapper}
      >
        <Animated.View
          style={[
            styles.boxContainer,
            { transform: [{ translateY: buttonsY }] },
          ]}
        >
          <View style={styles.box} onLayout={onBoxLayout}>
            {view === 'buttons' && (
              <>
                <Button
                  onPress={goLogin}
                  bgColor="#F0F0F0"
                  textStyle={{ color: '#000' }}
                  style={styles.button}
                >
                  Entrar
                </Button>
                <Button
                  onPress={goRegister}
                  bgColor="#000"
                  textStyle={{ color: '#FFF' }}
                  style={[styles.button, { marginTop: 12, marginBottom: 20 }]}
                >
                  Cadastrar-se
                </Button>
              </>
            )}

            {view === 'login' && <LoginForm onBack={goButtons} />}

            {view === 'register' && <RegisterForm onBack={goButtons} />}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFA600',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  splashImg: {
    position: 'absolute',
    alignSelf: 'center',
  },
  logo: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },

  boxWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  boxContainer: {
    width: '100%',
  },
  box: {
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFF',
  },
  button: {
    borderRadius: 20,
  },
});
