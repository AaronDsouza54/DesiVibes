// import { Stack, useRouter, useSegments } from "expo-router";
// import { useEffect, useState, useMemo } from "react";
// import { View, ActivityIndicator } from "react-native";
// import {
//   QueryClient,
//   QueryClientProvider,
// } from "@tanstack/react-query";

// export default function RootLayout() {
//   const router = useRouter();
//   const segments = useSegments();

//   const [isReady, setIsReady] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   // ✅ IMPORTANT: create QueryClient ONCE
//   const queryClient = useMemo(() => {
//     return new QueryClient({
//       defaultOptions: {
//         queries: {
//           retry: 1,
//           staleTime: 1000 * 60,
//         },
//       },
//     });
//   }, []);

//   // fake auth init
//   useEffect(() => {
//     const init = async () => {
//       const fakeAuthCheck = true;
//       setIsLoggedIn(fakeAuthCheck);
//       setIsReady(true);
//     };

//     init();
//   }, []);

//   // navigation guard
//   useEffect(() => {
//     if (!isReady) return;

//     const inAuthGroup = segments[0] === "(auth)";

//     if (!isLoggedIn && !inAuthGroup) {
//       router.replace("/(auth)/login");
//     }

//     if (isLoggedIn && inAuthGroup) {
//       router.replace("/(tabs)");
//     }
//   }, [isReady, isLoggedIn, segments]);

//   if (!isReady) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <Stack screenOptions={{ headerShown: false }} />
//     </QueryClientProvider>
//   );
// }


import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  // ✅ QueryClient must be stable (NOT recreated every render)
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 60,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}