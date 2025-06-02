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
import BgImage      from '../assets/images/bgImage.svg';
import Logo         from '../assets/images/logo.svg';
import SplashImage  from '../assets/images/splashImag.svg';
import LoginForm    from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP        = 10;
const TIMEOUT_MS = 2000;

export default function WelcomeScreen() {
  const router = useRouter();

  // Habilita LayoutAnimation no Android
  if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // Qual “view” está ativa: botões iniciais / login / register
  const [view, setView] = useState<'buttons' | 'login' | 'register'>('buttons');

  // Altura atual da caixa branca (onde fica formulário ou botões)
  const [boxH, setBoxH] = useState(0);
  // Posição vertical inicial da splash image (dentro do splash amarelo)
  const [imgTop, setImgTop] = useState(SCREEN_HEIGHT * 0.3);

  // Valores animados:
  const splashY     = useRef(new Animated.Value(0)).current;
  const buttonsY    = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const entryStartedRef = useRef(false);
  const prevBoxHRef     = useRef(0);

  /* ------------------------------------------------- *
   *              SUCESSO NO LOGIN                     *
   * ------------------------------------------------- */
  function handleLoginSuccess() {
    const offscreenUp   = -SCREEN_HEIGHT;
    const offscreenDown = boxH + GAP;

    Animated.parallel([
      Animated.timing(splashY, {
        toValue: offscreenUp,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsY, {
        toValue: offscreenDown,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/home');
    });
  }

  /* ------------------------------------------------- *
   *              PULSAR SPLASH IMAGE                   *
   * ------------------------------------------------- */
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
  }, []);

  /* ------------------------------------------------- *
   *         ANIMAÇÃO INICIAL (splash → caixa)         *
   * ------------------------------------------------- */
  useEffect(() => {
    if (boxH > 0 && !entryStartedRef.current) {
      // configura a caixa para começar fora da tela
      buttonsY.setValue(boxH);
      entryStartedRef.current = true;

      const timer = setTimeout(() => {
        // apos TIMEOUT_MS, move a splash e traz a caixa
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

  /* ------------------------------------------------- *
   *       REPOSICIONA O SPLASH QUANDO MUDAR ALTURA     *
   * ------------------------------------------------- */
  const onBoxLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (!h || h === prevBoxHRef.current) return;

    setBoxH(h);
    prevBoxHRef.current = h;

    if (entryStartedRef.current) {
      // Se estamos em “login”, adicionar um offset extra
      const extraGapLogin = view === 'login' ? 20 : 0;

      Animated.timing(splashY, {
        toValue: -(h + GAP + extraGapLogin),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  /* ------------------------------------------------- *
   *          TROCAR ENTRE BOTÕES / LOGIN / REGISTER    *
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

  return (
    <View style={styles.root}>
      {/* ================= SPLASH AMARELO ================= */}
      <Animated.View
        style={[
          styles.splash,
          { transform: [{ translateY: splashY }] },
        ]}
      >
        <BgImage
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Só pulsa a imagem quando estiver nos botões iniciais */}
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

      {/* ============= CAIXA BRANCA (LOGIN / REGISTER) ============= */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={
          view === 'login' ? -130 : view === 'register' ? -100 : 0
        }
        style={styles.boxWrapper}
      >
        <Animated.View
          style={[
            styles.boxContainer,
            { transform: [{ translateY: buttonsY }] },
          ]}
        >
          <View style={styles.box} onLayout={onBoxLayout}>
            {/* --------- BOTÕES INICIAIS --------- */}
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

            {/* --------- FORMULÁRIO DE LOGIN --------- */}
            {view === 'login' && (
              <LoginForm
                onRegister={goRegister}
                onSuccess={handleLoginSuccess}
                onLayoutContainer={onBoxLayout}
              />
            )}

            {/* --------- FORMULÁRIO DE CADASTRO --------- */}
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

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  /*  SPLASH AMARELO  */
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

  /*  CAIXA BRANCA  */
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
