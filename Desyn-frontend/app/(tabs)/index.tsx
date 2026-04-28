import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { postsApi, Post } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => postsApi.getFeed({ limit: 20, cursor: pageParam ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });

  const onRefresh = async () => {
    try {
      await feedQuery.refetch();
    } catch (e) {
      Alert.alert('Error', 'Failed to refresh');
    }
  };

  const posts = useMemo(() => {
    return feedQuery.data?.pages.flatMap(p => p.items) ?? [];
  }, [feedQuery.data]);

  const handleLike = async (post: Post) => {
    try {
      if (likedPosts.has(post.id)) {
        await postsApi.unlikePost(post.id);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.id);
          return newSet;
        });
      } else {
        await postsApi.likePost(post.id);
        setLikedPosts(prev => new Set(prev).add(post.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = likedPosts.has(post.id) || post.is_liked;

    return (
      <View style={[styles.postCard, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.user_id}`)}
            style={styles.authorInfo}>
            {post.author?.profile?.avatar_url && (
              <Image
                source={{ uri: post.author.profile.avatar_url }}
                style={styles.avatar}
              />
            )}
            <View>
              <ThemedText type="defaultSemiBold">{post.author?.display_name || post.author?.username}</ThemedText>
              <ThemedText style={styles.timestamp}>
                {new Date(post.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <Image
            source={{ uri: post.media[0].url }}
            style={styles.postMedia}
            resizeMode="cover"
          />
        )}

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text
              style={[styles.caption, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              numberOfLines={3}>
              <ThemedText type="defaultSemiBold">{post.author?.username} </ThemedText>
              {post.caption}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.action} onPress={() => handleLike(post)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#e74c3c' : tintColor}
            />
            <ThemedText style={styles.actionText}>{post.like_count}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push(`/post/${post.id}`)}>
            <Ionicons name="chatbubble-outline" size={24} color={tintColor} />
            <ThemedText style={styles.actionText}>{post.comment_count}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
            <Ionicons name="share-social-outline" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Visibility Badge */}
        {post.visibility !== 'public' && (
          <View style={styles.visibilityBadge}>
            <Ionicons name="lock-closed" size={12} color="#999" />
            <ThemedText style={styles.visibilityText}>{post.visibility}</ThemedText>
          </View>
        )}
      </View>
    );
  };

  if (feedQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={tintColor} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tintColor }]}>Desyn</Text>
        <TouchableOpacity onPress={() => router.push('/create-post')}>
          <Ionicons name="add-circle-outline" size={28} color={tintColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={post => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={<RefreshControl refreshing={feedQuery.isRefetching} onRefresh={onRefresh} />}
        contentContainerStyle={styles.feedContent}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
            feedQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.7}
        ListFooterComponent={
          feedQuery.isFetchingNextPage ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator color={tintColor} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <ThemedText>No posts yet. Follow some creators!</ThemedText>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  feedContent: {
    paddingVertical: 8,
  },
  postCard: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  postMedia: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    opacity: 0.6,
  },
  visibilityText: {
    fontSize: 11,
  },
});

