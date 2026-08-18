import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Conversation, UserStory } from '@/assets/types'
import { useRouter } from 'expo-router';
// import { dummyConversationData } from '@/assets/assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/MessagesScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import StoriesBar from '@/components/StoriesBar';
import StoryViewer from '@/components/StoryViewer';
import ConverstaionItem from '@/components/ConverstaionItem';
import SearchBar from '@/components/SearchBar';
import { api, useApp } from '@/context/AppContext';

export default function MessagesScreen() {
  const { setSelectedConversation, conversations, setConversations, selectedConversation, unreadCount } = useApp()
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  const router = useRouter();

  const fetchConversations = () => {
    setLoading(true)
    api.get<{ success: boolean; conversations: Conversation[] }>("/api/messages/conversations").then(({ data }) => {
      if (data.success) setConversations(data.conversations);
      setLoading(false)
    }).catch(() => {
      setTimeout(fetchConversations, 1000)
    })
  }

  useEffect(() => {
    fetchConversations()
  }, []);

  const lowerSearch = search.toLowerCase()
  const filtered = search ? conversations?.filter(
    (c) => c.participant?.name.toLowerCase().includes(lowerSearch) || c.
      participant?.handle.toLowerCase().includes(lowerSearch)
  ) : conversations;

  const openConversation = (c: Conversation) => {
    setSelectedConversation(c)
    router.push(`/chat/${c._id}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Conversations</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={Colors.onSurface} />
            {unreadCount > 0 && (
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>

      {/* Search */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder="Search Conversations..."
      />

      {/* Stories */}
      <StoriesBar onViewStory={(us) => setSelectedStory(us)} />
      {selectedStory && <StoryViewer userStory={selectedStory} onClose={() => setSelectedStory(null)} />}

      {/* Divider  */}
      <View style={styles.divider} />

      {/* Conversation list  */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ConverstaionItem converstaion={item} selected={false} onPress={() => openConversation(item)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Image
                source={require('@/assets/images/empty-messages.png')}
                style={{ width: 340, height: 340, resizeMode: 'contain' }}
              />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Go to search to start chatting</Text>
            </View>
          }
        />
      )}



    </SafeAreaView>
  )
}


// Pro Note:
// First write comments for each section you wanna write while planning
