import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Conversation, User as IUser } from '@/assets/types'
// import { dummyUsers } from '@/assets/assets'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from '@/assets/styles/SearchScreen.styles'
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/assets/constants/Colors'
import Avatar from '@/components/Avatar'
import SearchBar from '@/components/SearchBar'
import { api, useApp } from '@/context/AppContext'
import ContextCreationModal from '@/components/ContextCreationModal'
import { useAuth } from '@clerk/expo';

export default function SearchScreen() {

  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const isSignedInRef = useRef(isSignedIn);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  

  const {setConversations,setSelectedConversation, users: globalUsers, onlineUsers}= useApp();

  const [selectedUsersForChat, setSelectedUsersForChat] = useState<IUser[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  
  const handleUserTap = (user: IUser) => {
    setSelectedUsersForChat(prev => {
      if (prev.some(u => u._id === user._id)) {
        return prev.filter(u => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateConversation = async (contextType: string, contextData?: any) => {
    if (selectedUsersForChat.length === 0) return;
    
    try {
        const { data } = await api.post<{ success: boolean; conversation: Conversation }>(
            `/api/messages/`,
            {
                participantIds: selectedUsersForChat.map(u => u._id),
                contextType,
                context: contextData
            }
        )

        if (data.success) {
            setSelectedConversation(data.conversation);
            setConversations((prev) =>
                prev.some((c) => c._id === data.conversation._id)
                    ? prev
                    : [data.conversation, ...prev]
            );
            setModalVisible(false);
            setSelectedUsersForChat([]);
            router.push(`/chat/${data.conversation._id}`);
        }
    } catch {
        Alert.alert("Error", "Failed to create conversation");
    }
  }


useEffect(() => {
  isSignedInRef.current = isSignedIn;
}, [isSignedIn]);

const fetchUsers = useCallback(async (attempt = 0) => {
    if (!isSignedInRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true)
    try {
        const endpoint = search ? `/api/users/search?query=${search}` : "/api/users";
        const { data } = await api.get<{success: boolean, users: IUser[]}>
        (endpoint)
        if(data.success) setUsers(data.users)
        setLoading(false)
    } catch {
        const delay = Math.min(1000 * 2 ** attempt, 30_000);
        if (isSignedInRef.current && attempt < 6) {
          retryTimerRef.current = setTimeout(() => fetchUsers(attempt + 1), delay);
        }
        else setLoading(false);
    }
}, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => {
      clearTimeout(timer);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }
  }, [fetchUsers]);




  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.title}>Search</Text>
        {selectedUsersForChat.length > 0 && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Start Chat ({selectedUsersForChat.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder="Search by email or handle..."
        autoCapitalize="none"
      />

      {/* Results  */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) :
        (
          <FlatList
            data={users}
            keyExtractor={(u) => u._id}
            contentContainerStyle={styles.list}
            renderItem={({ item: u }) => {
              const isSelected = selectedUsersForChat.some(su => su._id === u._id);
              const globalUser = globalUsers.find((gu) => gu._id === u._id);
              const isOnline = onlineUsers[u._id] !== undefined 
                ? onlineUsers[u._id] 
                : (globalUser ? globalUser.isOnline : u.isOnline);
              return (
              <TouchableOpacity style={[styles.userRow, isSelected && { backgroundColor: Colors.surfaceHigh }]} activeOpacity={0.7} onPress={() => handleUserTap(u)}>
                <Avatar name={u.name} src={u.avatar} size={44} online={isOnline} />

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userHandle}>@{u.handle}</Text>
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: Colors.outlineVariant }}>{search ? "No users found" : "Search for people to chat with "}</Text>
              </View>
            }
          />
        )}

      <ContextCreationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onCreate={handleCreateConversation} 
      />
    </SafeAreaView>
  )
}
