import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  community_type: string;
  member_count: number;
  is_member: boolean;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  category: string;
  starts_at: string;
  location_city?: string;
}

export default function ExploreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Mock data for now - replace with API calls
    setLoadingCommunities(false);
    setLoadingEvents(false);
    
    // TODO: Replace with actual API calls when backend is ready
    setCommunities([
      {
        id: '1',
        name: 'South Asian Tech',
        slug: 'south-asian-tech',
        description: 'Tech community for South Asians',
        community_type: 'technology',
        member_count: 1200,
        is_member: false,
      },
      {
        id: '2',
        name: 'Bollywood Fans',
        slug: 'bollywood-fans',
        description: 'Celebrate Bollywood cinema',
        community_type: 'entertainment',
        member_count: 5300,
        is_member: false,
      },
    ]);

    setEvents([
      {
        id: '1',
        title: 'Diwali Festival 2024',
        description: 'Annual Diwali celebration',
        category: 'festival',
        starts_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location_city: 'Toronto',
      },
      {
        id: '2',
        title: 'South Asian Tech Meetup',
        description: 'Monthly meetup for tech professionals',
        category: 'tech',
        starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location_city: 'Vancouver',
      },
    ]);
  };

  const CommunityCard = ({ community }: { community: Community }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
      onPress={() => router.push(`/community/${community.id}`)}>
      {community.avatar_url && (
        <Image source={{ uri: community.avatar_url }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold">{community.name}</ThemedText>
        <ThemedText style={styles.cardMeta}>{community.member_count} members</ThemedText>
        {community.description && (
          <ThemedText style={styles.description} numberOfLines={2}>
            {community.description}
          </ThemedText>
        )}
      </View>
      <Ionicons
        name={community.is_member ? 'checkmark-circle' : 'add-circle-outline'}
        size={24}
        color={tintColor}
      />
    </TouchableOpacity>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
      onPress={() => router.push(`/event/${event.id}`)}>
      {event.cover_url && (
        <Image source={{ uri: event.cover_url }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold">{event.title}</ThemedText>
        <ThemedText style={styles.cardMeta}>{event.category}</ThemedText>
        {event.location_city && (
          <ThemedText style={styles.cardMeta}>📍 {event.location_city}</ThemedText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color={tintColor} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <ThemedText type="title">Explore</ThemedText>
      </View>

      <View style={[styles.searchBox, { borderColor: tintColor }]}>
        <Ionicons name="search" size={20} color={tintColor} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#ccc'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Communities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Communities</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          {loadingCommunities ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            communities.map(community => (
              <CommunityCard key={community.id} community={community} />
            ))
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Upcoming Events</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          {loadingEvents ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            events.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </View>

        {/* Creators Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Top Creators</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>See all</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.placeholder}>Featured creators coming soon</ThemedText>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: '#ddd',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  placeholder: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 20,
  },
});
