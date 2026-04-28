import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', String(error));
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tintColor }]}>Desyn</Text>
          <ThemedText type="subtitle">South Asian Social Network</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="subtitle" style={styles.formLabel}>
            Login
          </ThemedText>

          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            placeholder="Email"
            placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { borderColor: tintColor }]}
            placeholder="Password"
            placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.7}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <ThemedText style={styles.dividerText}>or</ThemedText>
          <View style={styles.line} />
        </View>

        <TouchableOpacity onPress={goToRegister} activeOpacity={0.7}>
          <ThemedText style={styles.linkText}>
            Don&apos;t have an account? <Text style={{ color: tintColor, fontWeight: '600' }}>Sign up</Text>
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  form: {
    marginBottom: 30,
  },
  formLabel: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    height: 48,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    height: 48,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  linkText: {
    textAlign: 'center',
    fontSize: 14,
  },
});
