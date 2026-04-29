import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export default function EventScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'];

  const [isAttending, setIsAttending] = useState(false);

  const handleAttend = async () => {
    try {
      setIsAttending(!isAttending);
      Alert.alert('Success', isAttending ? 'You\'ll attend this event' : 'No longer attending');
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Event</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Cover */}
        <View style={[styles.cover, { backgroundColor: tintColor + '20' }]}>
          <Ionicons name="calendar" size={80} color={tintColor} />
        </View>

        {/* Event Info */}
        <View style={styles.infoSection}>
          <ThemedText type="title">Diwali Festival 2024</ThemedText>
          <ThemedText style={styles.subtitle}>Annual celebration</ThemedText>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={tintColor} />
            <View style={styles.detailText}>
              <ThemedText type="defaultSemiBold">When</ThemedText>
              <ThemedText>{eventDate.toLocaleDateString()} • 6:00 PM</ThemedText>
            </View>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={tintColor} />
            <View style={styles.detailText}>
              <ThemedText type="defaultSemiBold">Where</ThemedText>
              <ThemedText>High Park, Toronto, Canada</ThemedText>
            </View>
          </View>

          {/* Attendance */}
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={20} color={tintColor} />
            <View style={styles.detailText}>
              <ThemedText type="defaultSemiBold">Attendees</ThemedText>
              <ThemedText>+ 1,432 going</ThemedText>
            </View>
          </View>

          {/* Attend Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isAttending ? tintColor : '#f0f0f0' }]}
            onPress={handleAttend}>
            <ThemedText style={{ color: isAttending ? '#fff' : '#000', fontWeight: '600' }}>
              {isAttending ? '✓ I\'m Attending' : '+ Mark as Attending'}
            </ThemedText>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={[styles.outlineButton, { borderColor: tintColor }]}>
            <Ionicons name="share-social-outline" size={18} color={tintColor} />
            <ThemedText style={{ color: tintColor }}>Share Event</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText type="subtitle">About the Event</ThemedText>
          <ThemedText style={styles.description}>
            Join us for our annual Diwali celebration featuring traditional music, dance performances, authentic
            South Asian food, and family-friendly activities. This is a vibrant community gathering celebrating the
            festival of lights!
          </ThemedText>
        </View>

        {/* Highlights */}
        <View style={styles.section}>
          <ThemedText type="subtitle">What to Expect</ThemedText>
          {['🎭 Cultural performances', '🍜 Authentic cuisines', '🎆 Fireworks display', '👨‍👩‍👧‍👦 Family activities'].map(
            (item, idx) => (
              <View key={idx} style={styles.highlightItem}>
                <ThemedText>{item}</ThemedText>
              </View>
            )
          )}
        </View>

        {/* Organizer */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Organized by</ThemedText>
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar} />
            <View style={styles.organizerInfo}>
              <ThemedText type="defaultSemiBold">Toronto South Asian Community</ThemedText>
              <ThemedText style={styles.organizerMeta}>Verified • 5.2K members</ThemedText>
            </View>
            <TouchableOpacity style={[styles.followButton, { borderColor: tintColor }]}>
              <ThemedText style={{ color: tintColor, fontWeight: '600' }}>Follow</ThemedText>
            </TouchableOpacity>
          </View>
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailText: {
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  outlineButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  description: {
    lineHeight: 20,
    marginTop: 8,
  },
  highlightItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
});
