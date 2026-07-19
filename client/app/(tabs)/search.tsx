import React, { useEffect, useState } from 'react'
import type { Conversation, User as IUser } from '@/assets/types'
// import { dummyUsers } from '@/assets/assets'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from '@/assets/styles/SearchScreen.styles'
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TextInput } from 'react-native-gesture-handler'
import { Colors } from '@/assets/constants/Colors'
import Avatar from '@/components/Avatar'
import { api, useApp } from '@/context/AppContext'

export default function SearchScreen() {

  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  

  const {setConversations,setSelectedConversation}= useApp();

const startChat = async (user: IUser) => {
    try {
        const { data } = await api.get<{ success: boolean; conversation: Conversation }>(
            `/api/messages/conversations/with/${user._id}`
        )

        if (data.success) {
            setSelectedConversation(data.conversation);
            setConversations((prev) =>
                prev.some((c) => c._id === data.conversation._id)
                    ? prev
                    : [data.conversation, ...prev]
            );
            router.push(`/chat/${data.conversation._id}`);
        }
    } catch (error) {
        Alert.alert("Error", "Failed to open conversation");
    }
}


const fetchUsers = async () => {
    setLoading(true)
    try {
        const endpoint = search ? `/api/users/search?query=${search}` : "/api/users";
        const { data } = await api.get<{success: boolean, users: IUser[]}>
        (endpoint)
        if(data.success) setUsers(data.users)
        setLoading(false)
    } catch (error) {
        setTimeout(fetchUsers, 1000)
    }
}

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [search]);




  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.outlineVariant} />
        <TextInput style={[styles.searchInput, { outline: "none" }]}
          placeholder='Search by email or handle...'
          placeholderTextColor={Colors.outlineVariant}
          autoCapitalize='none'
          value={search}
          onChangeText={setSearch} />

        {search.length > 0 ? <TouchableOpacity onPress={() => setSearch("")}>
          <Ionicons name='close-circle' size={16} color={Colors.outlineVariant} />
        </TouchableOpacity> : ""}
      </View>

      {/* Results  */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) :
        (
          <FlatList
            data={users}
            keyExtractor={(u) => u._id}
            contentContainerStyle={styles.list}
            renderItem={({ item: u }) => (
              <TouchableOpacity style={styles.userRow} activeOpacity={0.7} onPress={() => startChat(u)}>
                <Avatar name={u.name} src={u.avatar} size={44} online={u.isOnline} />

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userHandle}>@{u.handle}</Text>
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: Colors.outlineVariant }}>{search ? "No users found" : "Search for people to chat with "}</Text>
              </View>
            }
          />
        )}

    </SafeAreaView>
  )
}