import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRoute, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postsApi, Post, Comment } from '@/lib/api/posts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function PostScreen() {
  const router = useRouter();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
  }, []);

  const loadPost = async () => {
    try {
      const postID = (route.params as any)?.id;
      if (postID) {
        const postData = await postsApi.getPost(postID);
        setPost(postData);
        const commentsData = await postsApi.getComments(postID);
        setComments(commentsData.comments);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;

    setSubmitting(true);
    try {
      const comment = await postsApi.addComment(post.id, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.center}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const CommentItem = ({ comment }: { comment: Comment }) => (
    <View style={[styles.commentCard, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
      <View style={styles.commentHeader}>
        <ThemedText type="defaultSemiBold">{comment.author?.username}</ThemedText>
        <ThemedText style={styles.timestamp}>{new Date(comment.created_at).toLocaleDateString()}</ThemedText>
      </View>
      <ThemedText style={styles.commentBody}>{comment.body}</ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Post</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        contentContainerStyle={styles.commentsList}
        ListHeaderComponent={
          <View>
            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <Image source={{ uri: post.media[0].url }} style={styles.postMedia} resizeMode="cover" />
            )}

            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity style={styles.authorInfo}>
                {post.author?.profile?.avatar_url && (
                  <Image
                    source={{ uri: post.author.profile.avatar_url }}
                    style={styles.avatar}
                  />
                )}
                <View>
                  <ThemedText type="defaultSemiBold">{post.author?.display_name || post.author?.username}</ThemedText>
                  <ThemedText style={styles.timestamp}>{new Date(post.created_at).toLocaleDateString()}</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            {/* Post Caption */}
            {post.caption && (
              <View style={styles.captionContainer}>
                <ThemedText>{post.caption}</ThemedText>
              </View>
            )}

            {/* Post Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.action}>
                <Ionicons name="heart-outline" size={24} color={tintColor} />
                <ThemedText style={styles.actionText}>{post.like_count} Likes</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action}>
                <Ionicons name="chatbubble-outline" size={24} color={tintColor} />
                <ThemedText style={styles.actionText}>{post.comment_count} Comments</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <ThemedText type="subtitle" style={styles.commentsTitle}>Comments</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <ThemedText>No comments yet. Be the first!</ThemedText>
          </View>
        }
      />

      {/* Comment Input */}
      <View style={[styles.commentInput, { borderTopColor: tintColor }]}>
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
          placeholder="Add a comment..."
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
          value={newComment}
          onChangeText={setNewComment}
          editable={!submitting}
          multiline
        />
        <TouchableOpacity onPress={handleSubmitComment} disabled={submitting || !newComment.trim()}>
          <Ionicons name="send" size={24} color={tintColor} />
        </TouchableOpacity>
      </View>
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
  postMedia: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd',
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  commentsTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  commentCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentBody: {
    lineHeight: 20,
  },
  emptyComments: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
});
