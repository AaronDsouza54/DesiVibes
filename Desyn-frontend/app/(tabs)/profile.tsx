import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usersApi, UserWithProfile } from '@/lib/api/users';
import { postsApi, Post } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ProfileTab() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [profile, setProfile] = useState<UserWithProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (authUser) {
        const result = await usersApi.getMe();
        setProfile(result);
        const postsResult = await postsApi.getUserPosts(authUser.id);
        setPosts(postsResult.posts);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            router.replace('/auth/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.center}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover and Avatar */}
        <View style={styles.coverSection}>
          <View style={[styles.cover, { backgroundColor: tintColor + '20' }]} />
          {profile.profile?.avatar_url && (
            <Image source={{ uri: profile.profile.avatar_url }} style={styles.avatar} />
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <ThemedText type="title">{profile.display_name || profile.username}</ThemedText>
          <ThemedText style={styles.handle}>@{profile.username}</ThemedText>
          {profile.profile?.bio && <ThemedText style={styles.bio}>{profile.profile.bio}</ThemedText>}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{profile.profile?.post_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Posts</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{profile.profile?.follower_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Followers</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{profile.profile?.following_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Following</ThemedText>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]}>
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Edit Profile</ThemedText>
          </TouchableOpacity>

          {/* Profile Details */}
          {profile.profile?.location_city && (
            <View style={styles.detail}>
              <Ionicons name="location" size={16} color={tintColor} />
              <ThemedText>{profile.profile.location_city}</ThemedText>
            </View>
          )}
        </View>

        {/* Posts */}
        <View style={styles.section}>
          <ThemedText type="subtitle">My Posts</ThemedText>
          {posts.length === 0 ? (
            <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
          ) : (
            posts.map(post => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => router.push(`/post/${post.id}`)}>
                {post.media && post.media.length > 0 && (
                  <Image source={{ uri: post.media[0].url }} style={styles.postThumbnail} />
                )}
                <View style={styles.postMeta}>
                  <ThemedText numberOfLines={2}>{post.caption || '(No caption)'}</ThemedText>
                  <ThemedText style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</ThemedText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Settings</ThemedText>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color={tintColor} />
            <ThemedText>Notifications</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={20} color={tintColor} />
            <ThemedText>Privacy</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color={tintColor} />
            <ThemedText>Help</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  coverSection: {
    position: 'relative',
    height: 200,
    alignItems: 'center',
  },
  cover: {
    width: '100%',
    height: 120,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    position: 'absolute',
    top: 70,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  handle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  bio: {
    marginVertical: 12,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginVertical: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 16,
  },
  postItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  postThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  postMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
