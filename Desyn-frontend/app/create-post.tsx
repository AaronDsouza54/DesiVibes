import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Switch,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { postsApi } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { uploadImageToSupabase } from '@/lib/storage/upload';
import { useAuth } from '@/lib/auth/AuthContext';

function getMediaInfo(asset: ImagePicker.ImagePickerAsset) {
  const fallbackType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
  const mimeType = asset.mimeType ?? fallbackType;
  const extensionFromMime = mimeType.includes('/') ? mimeType.split('/')[1] : null;
  const extensionFromUri = asset.uri.split('.').pop();
  const extension = (extensionFromMime ?? extensionFromUri ?? 'bin').toLowerCase();

  return { mimeType, extension };
}

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = isDark ? Colors.indigoLight : Colors.indigo;
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'family' | 'groups'>('public');
  const [isPaid, setIsPaid] = useState(false);
  const [priceCents, setPriceCents] = useState('0');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);

  const safeGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  useEffect(() => {
    // Make Android's hardware back behave like the on-screen "close" button.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      safeGoBack();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    // If the user picks a new image, we need to re-upload.
    setUploadedMediaUrls([]);
    setUploadingMedia(false);
  }, [selectedAsset?.uri]);

  const optionRowBg = isDark ? 'rgba(255,255,255,0.07)' : '#f5f5f5';
  const optionActiveBg = isDark ? 'rgba(129,140,248,0.18)' : '#e8f4f8';

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setSelectedAsset(result.assets[0] ?? null);
    }
  };

  const uploadSelectedImage = async () => {
    if (!selectedAsset?.uri) return;
    if (!user?.id) {
      Alert.alert('Error', 'Please log in again.');
      return;
    }

    setUploadingMedia(true);
    try {
      const { mimeType, extension } = getMediaInfo(selectedAsset);
      const uploaded = await uploadImageToSupabase({
        bucket: 'post-images',
        path: `${user.id}/${Date.now()}.${extension}`,
        localUri: selectedAsset.uri,
        contentType: mimeType,
      });
      setUploadedMediaUrls([uploaded.publicUrl]);
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !selectedAsset?.uri) {
      Alert.alert('Error', 'Please add a caption or a photo');
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = uploadedMediaUrls;
      // Fallback: if user didn't tap "Done" yet, still upload on submit.
      if (mediaUrls.length === 0 && selectedAsset?.uri) {
        if (!user?.id) throw new Error('Not authenticated');
        const { mimeType, extension } = getMediaInfo(selectedAsset);
        const uploaded = await uploadImageToSupabase({
          bucket: 'post-images',
          path: `${user.id}/${Date.now()}.${extension}`,
          localUri: selectedAsset.uri,
          contentType: mimeType,
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
      safeGoBack();
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={safeGoBack}>
          <Ionicons name="close" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Create Post</ThemedText>
        <TouchableOpacity onPress={handlePost} disabled={loading || uploadingMedia}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <ThemedText style={{ color: tintColor }}>Post</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Picker */}
        <View style={styles.imageBox}>
          {selectedAsset?.uri ? (
            <>
              {selectedAsset.type === 'video' ? (
                <View style={[styles.imageUpload, { backgroundColor: '#111' }]}>
                  <Ionicons name="videocam" size={48} color={tintColor} />
                  <ThemedText>Video selected</ThemedText>
                </View>
              ) : (
                <Image source={{ uri: selectedAsset.uri }} style={styles.image} resizeMode="cover" />
              )}
              <View style={styles.imageActions}>
                {uploadedMediaUrls.length === 0 ? (
                  <TouchableOpacity
                    onPress={uploadSelectedImage}
                    disabled={uploadingMedia}
                    style={[styles.pickButton, { borderColor: tintColor, backgroundColor: tintColor }]}>
                    {uploadingMedia ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Done</ThemedText>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.uploadedPill}>
                    <Ionicons name="checkmark-circle" size={16} color={tintColor} />
                    <ThemedText style={{ color: tintColor, fontWeight: '700' }}>Ready</ThemedText>
                  </View>
                )}
              </View>
            </>
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

        {selectedAsset?.uri && (
          <TouchableOpacity onPress={pickImage} style={[styles.pickButton, { borderColor: tintColor, marginBottom: 16 }]}>
            <ThemedText style={{ color: tintColor }}>
              Change {selectedAsset.type === 'video' ? 'video' : 'photo'}
            </ThemedText>
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
              style={[
                styles.optionRow,
                { backgroundColor: optionRowBg },
                visibility === vis && { backgroundColor: optionActiveBg },
              ]}
              onPress={() => setVisibility(vis)}>
              <Ionicons name={visibility === vis ? 'radio-button-on' : 'radio-button-off'} size={20} color={tintColor} />
              <ThemedText style={{ textTransform: 'capitalize' }}>{vis}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Paid Post */}
        <View style={styles.section}>
          <View style={[styles.optionRow, { backgroundColor: optionRowBg }]}>
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
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  uploadedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  optionActive: {
    // (kept for compatibility; actual color is set inline using `optionActiveBg`)
    backgroundColor: '#e8f4f8',
  },
});

