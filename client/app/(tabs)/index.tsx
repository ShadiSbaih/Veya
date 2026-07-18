import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Conversation, UserStory } from '@/assets/types'
import { useRouter } from 'expo-router';
import { dummyConversationData } from '@/assets/assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/MessagesScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import StoriesBar from '@/components/StoriesBar';
import StoryViewer from '@/components/StoryViewer';
import ConverstaionItem from '@/components/ConverstaionItem';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  const router = useRouter();

  const fetchConversations = () => {
    setLoading(true);
    setTimeout(() => {
      setConversations(dummyConversationData as any);
      setLoading(false);
    }, 1000)
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
    router.push(`/chat/${c._id}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Conversations</Text>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conversations?.length}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.outlineVariant} />
        <TextInput style={[styles.searchInput, { outline: "none" }]}
          placeholder='Search Conversations...'
          placeholderTextColor={Colors.outlineVariant}
          value={search}
          onChangeText={setSearch} />
        {search.length > 0 ? <TouchableOpacity onPress={() => setSearch("")}>
          <Ionicons name='close-circle' size={16} color={Colors.outlineVariant} />
        </TouchableOpacity> : ""}
      </View>

      {/* Stories */}
      <StoriesBar onViewStory={(us) => setSelectedStory(us)} />
      {selectedStory && <StoryViewer userStory={selectedStory} onClose={() => setSelectedStory(null)} />}

      {/* Divider  */}
      <View style={styles.divider} />

      {/* Conversation list  */}
      {loading ? (<ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />)
        :
        <FlatList
          data={filtered}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ConverstaionItem converstaion={item} selected={false} onPress={() => openConversation(item)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbox-outline" size={44} color={Colors.outlineVariant}/>
            <Text style={styles.emptyTitle}>No conversations yet </Text>
            <Text style={styles.emptySubtitle}>Go to search to start chatting </Text>
          </View>
        }
        />
      }


    </SafeAreaView>
  )
}


// Pro Note:
// First write comments for each section you wanna write while planning 