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
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { postsApi } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { uploadImageToSupabase } from '@/lib/storage/upload';
import { useAuth } from '@/lib/auth/AuthContext';

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'family' | 'groups'>('public');
  const [isPaid, setIsPaid] = useState(false);
  const [priceCents, setPriceCents] = useState('0');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0]?.uri ?? null);
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !localImageUri) {
      Alert.alert('Error', 'Please add a caption or a photo');
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      if (localImageUri) {
        if (!user?.id) throw new Error('Not authenticated');
        const uploaded = await uploadImageToSupabase({
          bucket: 'post-images',
          path: `${user.id}/${Date.now()}.jpg`,
          localUri: localImageUri,
          contentType: 'image/jpeg',
        });
        mediaUrls = [uploaded.publicUrl];
      }

      await postsApi.createPost({
        caption: caption || undefined,
        visibility,
        location: location || undefined,
        is_paid: isPaid,
        price_cents: isPaid ? parseInt(priceCents) * 100 : undefined,
        media_urls: mediaUrls,
      });
      Alert.alert('Success', 'Post created!');
      router.back();
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Create Post</ThemedText>
        <TouchableOpacity onPress={handlePost} disabled={loading}>
          {loading ? <ActivityIndicator /> : <ThemedText style={{ color: tintColor }}>Post</ThemedText>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Picker */}
        <View style={styles.imageBox}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imageUpload}>
              <Ionicons name="image-outline" size={48} color={tintColor} />
              <ThemedText>Add Photo</ThemedText>
              <TouchableOpacity onPress={pickImage} style={[styles.pickButton, { borderColor: tintColor }]}>
                <ThemedText style={{ color: tintColor }}>Choose from library</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {localImageUri && (
          <TouchableOpacity onPress={pickImage} style={[styles.pickButton, { borderColor: tintColor, marginBottom: 16 }]}>
            <ThemedText style={{ color: tintColor }}>Change photo</ThemedText>
          </TouchableOpacity>
        )}

        {/* Caption */}
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: colorScheme === 'dark' ? '#fff' : '#000' }]}
          placeholder="Write a caption..."
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
        />

        {/* Location */}
        <TextInput
          style={[styles.input, { borderColor: tintColor, color: colorScheme === 'dark' ? '#fff' : '#000' }]}
          placeholder="Location (optional)"
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
          value={location}
          onChangeText={setLocation}
        />

        {/* Visibility */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Who can see this?</ThemedText>
          {(['public', 'followers', 'family', 'groups'] as const).map(vis => (
            <TouchableOpacity
              key={vis}
              style={[styles.optionRow, visibility === vis && styles.optionActive]}
              onPress={() => setVisibility(vis)}>
              <Ionicons name={visibility === vis ? 'radio-button-on' : 'radio-button-off'} size={20} color={tintColor} />
              <ThemedText style={{ textTransform: 'capitalize' }}>{vis}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Paid Post */}
        <View style={styles.section}>
          <View style={styles.optionRow}>
            <ThemedText>Gated/Paid Post</ThemedText>
            <Switch value={isPaid} onValueChange={setIsPaid} />
          </View>
          {isPaid && (
            <TextInput
              style={[styles.input, { borderColor: tintColor, color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              placeholder="Price ($)"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
              value={priceCents}
              onChangeText={setPriceCents}
              keyboardType="decimal-pad"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageBox: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageUpload: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pickButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionActive: {
    backgroundColor: '#e8f4f8',
  },
});

