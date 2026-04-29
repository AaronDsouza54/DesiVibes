import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usersApi, UserWithProfile } from '@/lib/api/users';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userID = params?.id;
      if (userID) {
        const result = await usersApi.getUser(userID);
        setUser(result.user);
        setFollowing(result.is_following);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (following) {
        await usersApi.unfollow(user.id);
      } else {
        await usersApi.follow(user.id);
      }
      setFollowing(!following);
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow');
    }
  };

  if (loading || !user) {
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">{user.username}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Cover and Avatar */}
        <View style={styles.coverSection}>
          <View style={[styles.cover, { backgroundColor: tintColor + '20' }]} />
          {user.profile?.avatar_url && (
            <Image source={{ uri: user.profile.avatar_url }} style={styles.avatar} />
          )}
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <ThemedText type="title">{user.display_name || user.username}</ThemedText>
          <ThemedText style={styles.handle}>@{user.username}</ThemedText>
          {user.profile?.bio && <ThemedText style={styles.bio}>{user.profile.bio}</ThemedText>}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{user.profile?.post_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Posts</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{user.profile?.follower_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Followers</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">{user.profile?.following_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Following</ThemedText>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: following ? '#f0f0f0' : tintColor }]}
            onPress={handleFollow}>
            <ThemedText style={{ color: following ? '#000' : '#fff', fontWeight: '600' }}>
              {following ? 'Following' : 'Follow'}
            </ThemedText>
          </TouchableOpacity>

          {/* Profile Details */}
          {user.profile?.location_city && (
            <View style={styles.detail}>
              <Ionicons name="location" size={16} color={tintColor} />
              <ThemedText>{user.profile.location_city}</ThemedText>
            </View>
          )}
          {user.profile?.website_url && (
            <View style={styles.detail}>
              <Ionicons name="link" size={16} color={tintColor} />
              <ThemedText style={{ color: tintColor }}>Visit Website</ThemedText>
            </View>
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
});
