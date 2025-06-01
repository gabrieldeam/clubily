// apps/client-react-native/app/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
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
import BgImage     from '../assets/images/bgImage.svg';
import Logo        from '../assets/images/logo.svg';
import SplashImage from '../assets/images/splashImag.svg';
import LoginForm   from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP        = 10;
const TIMEOUT_MS = 2000;

export default function WelcomeScreen() {
  const router = useRouter();

  // habilita LayoutAnimation no Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [view, setView] = useState<'buttons' | 'login' | 'register'>('buttons');
  const [boxH, setBoxH] = useState(0);               // altura atual da caixa
  const [imgTop, setImgTop] = useState(SCREEN_HEIGHT * 0.3);

  const splashY     = useRef(new Animated.Value(0)).current;
  const buttonsY    = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const entryStartedRef = useRef(false);
  const prevBoxHRef     = useRef(0);

  /* ------------------------------------------------- *
   *               LOGIN  SUCCEEDED                    *
   * ------------------------------------------------- */
  const handleLoginSuccess = () => {
    const offscreenUp   = -SCREEN_HEIGHT;
    const offscreenDown = boxH + GAP;

    Animated.parallel([
      Animated.timing(splashY,  { toValue: offscreenUp,   duration: 600, useNativeDriver: true }),
      Animated.timing(buttonsY, { toValue: offscreenDown, duration: 600, useNativeDriver: true }),
    ]).start(() => router.replace('/home'));
  };

  /* ------------------------------------------------- *
   *               PULSE ANIMATION                     *
   * ------------------------------------------------- */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  /* ------------------------------------------------- *
   *        FIRST ENTRY  (SPLASH → CAIXA)              *
   * ------------------------------------------------- */
  useEffect(() => {
    if (boxH > 0 && !entryStartedRef.current) {
      buttonsY.setValue(boxH);            // caixa começa fora da tela
      entryStartedRef.current = true;

      const timer = setTimeout(() => {
        setImgTop(SCREEN_HEIGHT * 0.45);  // move a imagem laranja
        Animated.parallel([
          Animated.timing(splashY,  { toValue: -(boxH + GAP), duration: 600, useNativeDriver: true }),
          Animated.timing(buttonsY, { toValue: 0,            duration: 600, useNativeDriver: true }),
          Animated.timing(logoOpacity, { toValue: 1,         duration: 600, useNativeDriver: true }),
        ]).start();
      }, TIMEOUT_MS);

      return () => clearTimeout(timer);
    }
  }, [boxH]);

  /* ------------------------------------------------- *
   *     REPOSICIONA  SPLASH  SE ALTURA MUDAR          *
   * ------------------------------------------------- */
  const onBoxLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (!h || h === prevBoxHRef.current) return;

    setBoxH(h);
    prevBoxHRef.current = h;

    if (entryStartedRef.current) {
      Animated.timing(splashY, {
        toValue: -(h + GAP),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  /* ------------------------------------------------- *
   *        TROCA ENTRE BOTÕES / LOGIN / REGISTER      *
   * ------------------------------------------------- */
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

  /* =================================================
     RENDER
     ================================================= */
  return (
    <View style={styles.root}>
      {/* ---------- SPLASH AMARELO ---------- */}
      <Animated.View style={[styles.splash, { transform: [{ translateY: splashY }] }]}>
        <BgImage width={SCREEN_WIDTH} height={SCREEN_HEIGHT} preserveAspectRatio="xMidYMid slice" />

        {view === 'buttons' && (
          <Animated.View
            style={[
              styles.splashImg,
              { top: imgTop, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <SplashImage width={400} height={400} />
          </Animated.View>
        )}

        <Animated.View style={[styles.logo, { opacity: logoOpacity }]}>
          <Logo width={200} height={150} />
        </Animated.View>
      </Animated.View>

      {/* ---------- CAIXA BRANCA ---------- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={view === 'login' ? -130 : view === 'register' ? -100 : 0}
        style={styles.boxWrapper}
      >
        <Animated.View style={[styles.boxContainer, { transform: [{ translateY: buttonsY }] }]}>
          <View style={styles.box} onLayout={onBoxLayout}>
            {/* BOTÕES INICIAIS -------------------------------------- */}
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

            {/* LOGIN ------------------------------------------------ */}
            {view === 'login' && (
              <LoginForm
                onRegister={goRegister}
                onSuccess={handleLoginSuccess}
                onLayoutContainer={onBoxLayout}   // <= avisa quando muda
              />
            )}

            {/* REGISTRO ------------------------------------------- */}
            {view === 'register' && (
              <RegisterForm
                onLogin={goLogin}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------- STYLES ---------- */
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

  /*  Caixa branca  */
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
