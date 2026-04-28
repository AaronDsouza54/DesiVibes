import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function CommunityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [isMember, setIsMember] = useState(false);

  const handleJoin = async () => {
    try {
      setIsMember(!isMember);
      Alert.alert('Success', isMember ? 'Left community' : 'Joined community');
    } catch (error) {
      Alert.alert('Error', 'Failed to update membership');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Community</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Cover */}
        <View style={[styles.cover, { backgroundColor: tintColor + '20' }]} />

        {/* Community Info */}
        <View style={styles.infoSection}>
          <ThemedText type="title">South Asian Tech</ThemedText>
          <ThemedText style={styles.description}>
            A thriving community for tech professionals and enthusiasts from South Asia
          </ThemedText>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">1,200</ThemedText>
              <ThemedText style={styles.statLabel}>Members</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">456</ThemedText>
              <ThemedText style={styles.statLabel}>Posts</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="defaultSemiBold">12</ThemedText>
              <ThemedText style={styles.statLabel}>Events</ThemedText>
            </View>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isMember ? '#f0f0f0' : tintColor }]}
            onPress={handleJoin}>
            <ThemedText style={{ color: isMember ? '#000' : '#fff', fontWeight: '600' }}>
              {isMember ? 'Leave Community' : 'Join Community'}
            </ThemedText>
          </TouchableOpacity>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: tintColor + '20' }]}>
              <ThemedText style={{ color: tintColor }}>technology</ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: tintColor + '20' }]}>
              <ThemedText style={{ color: tintColor }}>south-asian</ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: tintColor + '20' }]}>
              <ThemedText style={{ color: tintColor }}>professional</ThemedText>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <ThemedText style={styles.about}>
            This community was founded to create a safe and inclusive space for South Asian tech professionals to
            network, share knowledge, and support each other&apos;s career growth.
          </ThemedText>
        </View>

        {/* Recent Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Recent Posts</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.placeholder}>No posts yet</ThemedText>
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
  cover: {
    width: '100%',
    height: 150,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    marginVertical: 8,
    opacity: 0.7,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  about: {
    lineHeight: 20,
    marginTop: 8,
  },
  placeholder: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 16,
  },
});
