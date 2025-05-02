// src/navigation/RootNavigator.tsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase/client"; // Adjust path

// Import Screens
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import StoresScreen from "../screens/StoresScreen";
import RewardsScreen from "../screens/RewardsScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Define Tab Navigator
const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        // Add tab bar styling here if needed
        headerShown: false, // Hide header for tabs
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stores" component={StoresScreen} options={{ title: "Minhas Lojas" }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ title: "Recompensas" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Optional: Add a loading indicator component
    return null;
  }

  return (
    <NavigationContainer>
      {session && session.user ? <AppTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}

