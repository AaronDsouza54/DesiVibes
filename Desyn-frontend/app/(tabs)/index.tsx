import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { postsApi, Post } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = isDark ? '#fff' : '#000';
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  useFocusEffect(
    useCallback(() => {
      // Refresh feed whenever user returns to Home (e.g., after creating a post).
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }, [queryClient])
  );

  const isVideoUrl = (url: string) => {
    return /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(url);
  };

  const hasVideoMedia = (post: Post) => {
    const firstUrl = post.media?.[0]?.url ?? '';
    return Boolean(firstUrl) && isVideoUrl(firstUrl);
  };

  const ownVideoFallbackActive = useMemo(() => {
    const videoPosts = posts.filter(hasVideoMedia);
    const otherUsersVideoCount = videoPosts.filter(p => p.user_id !== user?.id).length;
    const ownVideoCount = videoPosts.filter(p => p.user_id === user?.id).length;
    return otherUsersVideoCount === 0 && ownVideoCount > 0;
  }, [posts, user?.id]);

  const feedPosts = useMemo(() => {
    if (!ownVideoFallbackActive) return posts;
    const ownVideos = posts.filter(p => p.user_id === user?.id && hasVideoMedia(p));
    const ownVideoIDs = new Set(ownVideos.map(p => p.id));
    const rest = posts.filter(p => !ownVideoIDs.has(p.id));
    // Prioritize own videos when there are no other users' videos, but still show all posts.
    return [...ownVideos, ...rest];
  }, [posts, ownVideoFallbackActive, user?.id]);

  const stories = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ id: string; username: string; avatarUrl?: string | null }> = [];

    for (const p of feedPosts) {
      if (!p.user_id || seen.has(p.user_id)) continue;
      seen.add(p.user_id);
      items.push({
        id: p.user_id,
        username: p.author?.username ?? 'user',
        avatarUrl: p.author?.profile?.avatar_url ?? null,
      });
      if (items.length >= 14) break;
    }

    return items;
  }, [feedPosts]);

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

  const StoryBubble = ({ username, avatarUrl }: { username: string; avatarUrl?: string | null }) => {
    return (
      <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
        <View style={[styles.storyRing, { borderColor: isDark ? Colors.rose : Colors.saffron }]}>
          <View style={[styles.storyAvatarWrap, { backgroundColor: isDark ? '#111' : '#f3f4f6' }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.storyAvatar} />
            ) : (
              <Ionicons name="person" size={28} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)'} />
            )}
          </View>
        </View>
        <ThemedText style={styles.storyLabel} numberOfLines={1}>
          {username}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isLiked = likedPosts.has(post.id) || post.is_liked;

    return (
      <View style={[styles.postCard, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.user_id}`)}
            style={styles.authorInfo}>
            <View style={[styles.avatarWrap, { backgroundColor: isDark ? '#111' : '#f3f4f6' }]}>
              {post.author?.profile?.avatar_url ? (
                <Image source={{ uri: post.author.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <Ionicons
                  name="person"
                  size={18}
                  color={isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)'}
                />
              )}
            </View>
            <View>
              <ThemedText type="defaultSemiBold">{post.author?.display_name || post.author?.username}</ThemedText>
              <ThemedText style={styles.timestamp}>
                {new Date(post.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={18} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          hasVideoMedia(post) ? (
            <View style={[styles.postMedia, styles.videoMediaPlaceholder]}>
              <Ionicons name="play-circle" size={48} color="#fff" />
              <ThemedText style={styles.videoMediaText}>Video post</ThemedText>
            </View>
          ) : (
            <Image
              source={{ uri: post.media[0].url }}
              style={styles.postMedia}
              resizeMode="cover"
            />
          )
        )}

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text
              style={[styles.caption, { color: isDark ? '#fff' : '#000' }]}
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
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push(`/post/${post.id}`)}>
            <Ionicons name="chatbubble-outline" size={24} color={tintColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
            <Ionicons name="share-social-outline" size={24} color={tintColor} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.action}>
            <Ionicons name="bookmark-outline" size={22} color={tintColor} />
          </TouchableOpacity>
        </View>

        {(post.like_count > 0 || post.comment_count > 0) && (
          <View style={styles.metaRow}>
            {post.like_count > 0 && (
              <ThemedText type="defaultSemiBold" style={styles.metaText}>
                {post.like_count} likes
              </ThemedText>
            )}
            {post.comment_count > 0 && (
              <ThemedText style={styles.metaText}>
                View all {post.comment_count} comments
              </ThemedText>
            )}
          </View>
        )}

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
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Desyn</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/create-post')} style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={26} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/activity' as any)} style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={26} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={styles.headerIconBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feedPosts}
        keyExtractor={post => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={<RefreshControl refreshing={feedQuery.isRefetching} onRefresh={onRefresh} />}
        contentContainerStyle={styles.feedContent}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            {ownVideoFallbackActive && (
              <View style={styles.fallbackBanner}>
                <ThemedText style={styles.fallbackBannerText}>
                  Showing your videos until other users post videos.
                </ThemedText>
              </View>
            )}
            <View style={styles.storiesWrap}>
              <FlatList
                data={stories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <StoryBubble username={item.username} avatarUrl={item.avatarUrl} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContent}
              />
            </View>
          </View>
        }
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    padding: 6,
  },
  feedContent: {
    paddingBottom: 12,
  },
  storiesWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    paddingVertical: 10,
  },
  fallbackBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  fallbackBannerText: {
    fontSize: 12,
    opacity: 0.95,
  },
  storiesContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  storyItem: {
    width: 78,
    alignItems: 'center',
    gap: 6,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: 58,
    height: 58,
  },
  storyLabel: {
    fontSize: 12,
    opacity: 0.9,
    maxWidth: 76,
    textAlign: 'center',
  },
  postCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    paddingBottom: 10,
  },
  postHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  moreButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  postMedia: {
    width: '100%',
    height: 360,
    backgroundColor: '#111',
  },
  videoMediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoMediaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  metaRow: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.9,
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

