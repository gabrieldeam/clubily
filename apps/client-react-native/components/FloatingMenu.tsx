// src/components/FloatingMenu/index.tsx  (ou onde estiver)
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

import HomeIcon from '../assets/icons/home.svg';
import ProfileIcon from '../assets/icons/profile.svg';

export default function FloatingMenu() {
  const router = useRouter();
  const pathname = usePathname();          // retorna '/home', '/profile'…

  const isHome    = pathname === '/home' || pathname === '/';
  const isProfile = pathname === '/profile';

  return (
    <View style={styles.container}>
      {/* HOME -------------------------------------------------- */}
      <TouchableOpacity
        style={[styles.button, isHome && styles.activeButton]}
        onPress={() => router.push('/home')}  
      >
        <HomeIcon width={27} height={27} />
      </TouchableOpacity>

      {/* PROFILE ---------------------------------------------- */}
      <TouchableOpacity
        style={[styles.button, isProfile && styles.activeButton]}
        onPress={() => router.push('/profile')} 
      >
        <ProfileIcon width={27} height={27} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#000',
    borderColor: '#1D1D1D',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  activeButton: {
    backgroundColor: '#FF4C00',
  },
});
