import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === "dark";
  const bg = isDark ? "#000" : "#fff";
  const fg = isDark ? "#fff" : "#000";
  const border = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)";

  const baseHeight = 62;
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 18 : 14);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: fg,
        tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
        tabBarHideOnKeyboard: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: Platform.OS === "ios" ? 0.5 : 0.75,
          height: baseHeight + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = size ?? 26;

          const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? "home" : "home-outline",
            explore: focused ? "search" : "search-outline",
            create: focused ? "add-circle" : "add-circle-outline",
            activity: focused ? "heart" : "heart-outline",
            profile: focused ? "person" : "person-outline",
          };

          const iconName =
            iconByRoute[route.name] ?? (focused ? "ellipse" : "ellipse-outline");

          // Keep the center "create" icon a touch larger.
          const finalSize = route.name === "create" ? iconSize + 4 : iconSize;

          // For brand feel, make the create icon match a brand color in light mode.
          const finalColor =
            route.name === "create" && !isDark ? Colors.indigo : color;

          return (
            <Ionicons
              name={iconName}
              size={finalSize}
              color={finalColor}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
        }}
      />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}