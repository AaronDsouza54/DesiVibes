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
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Error', 'Email, username, and password are required');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Username/displayName will be stored in our backend Profile on first login.
      await signUp(email, password);
      Alert.alert('Success', 'Account created. Please log in.');
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Registration Failed', String(error));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <SafeAreaView>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToLogin}>
              <ThemedText style={styles.backText}>← Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.formLabel}>
              Create Account
            </ThemedText>
          </View>

          <View style={styles.form}>
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
              placeholder="Username"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { borderColor: tintColor }]}
              placeholder="Display Name (optional)"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { borderColor: tintColor }]}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.7}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
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
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
  },
  backText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#007AFF',
  },
  form: {
    marginBottom: 20,
  },
  formLabel: {
    marginBottom: 20,
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
  terms: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
});
