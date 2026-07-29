import { View, Text, TouchableOpacity, KeyboardAvoidingView, ActivityIndicator, Platform, FlatList, Image, TextInput, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
// import { dummyConversationData, dummyMessages, dummyUserProfile, dummyUsers } from '@/assets/assets'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from '@/assets/styles/ChatScreen.styles'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/assets/constants/Colors'
import { formatTime } from '@/utils/formatTime'
import Avatar from '@/components/Avatar'
import ChatBubble from '@/components/ChatBubble'
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from 'expo-linear-gradient'
import { api, useApp } from '@/context/AppContext'
import { Message, ConversationContextType } from '@/assets/types'
import ContextHeader from '@/components/ContextHeader'
import ContextCreationModal from '@/components/ContextCreationModal'
import DecisionCreationModal from '@/components/DecisionCreationModal'



export default function ChatScreen() {

  const router = useRouter()
  let { auth, messages, users, selectedConversation, typingUsers, setConversations, setSelectedConversation, setMessages, sendWsEvent } = useApp()

  const { id } = useLocalSearchParams<{ id: string }>()
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaMime, setMediaMime] = useState<string>("image/jpeg")
  const [mediaName, setMediaName] = useState<string>("media.jpg")
  const [decisionModalVisible, setDecisionModalVisible] = useState(false)
  const [contextModalVisible, setContextModalVisible] = useState(false)


  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  const partner = selectedConversation?.participant;


  // Load messages for this conversation
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchMessages = () => {
      api.get(`/api/messages/conversations/${id}/messages`).then(({ data }) => {
        if (data.success) {
          setMessages(data.messages);
          setLoading(false);
        }
      }).catch(() => {
        setTimeout(fetchMessages, 1000)
      })
    }
    fetchMessages();
  }, [id])

  const deleteChat = () => {
    const msg = `Delete this chat? This cannot be undone.`;
    Alert.alert("Delete Chat", msg, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete(`/api/messages/conversations/${selectedConversation?._id}`)
            if (data.success) {
              setConversations((prev) => prev.filter((c) => c._id !== selectedConversation?._id))
              setSelectedConversation(null)
              router.back()
            }
          } catch (error) {
            console.log(" error deleting chat")
            Alert.alert("Error", "Failed to delete chat");
          }
        }
      }
    ])
  }

  const toggleContextStatus = async () => {
    if (!selectedConversation) return;
    const newStatus = selectedConversation.status === "completed" ? "active" : "completed";
    try {
      const { data } = await api.patch(`/api/messages/conversations/${selectedConversation._id}/status`, {
        status: newStatus
      });
      if (data.success) {
        // Update local state
        const updatedConv = { ...selectedConversation, status: newStatus as any };
        setSelectedConversation(updatedConv);
        setConversations(prev => 
          prev.map(c => c._id === updatedConv._id ? updatedConv : c)
        );
      }
    } catch (error) {
      console.log("error updating status", error);
      Alert.alert("Error", "Failed to update conversation status");
    }
  }

  const pickMedia = async () => {
    const { status } = await ImagePicker.
      requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permission needed", "Allow access to send media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', "videos"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaMime(asset.mimeType || "image/jpeg");
      setMediaName(asset.fileName || `media.${asset.type === "video" ? "mp4" : "jpg"}`);
    }
  }

  const handleTyping = (val: string) => {
    setText(val)
    const target = { receiverId: partner?._id };
    if (!target.receiverId) return;

    sendWsEvent({ type: "typing", ...target, isTyping: true });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      sendWsEvent({ type: "typing", ...target, isTyping: false })
    }, 1500)
  }
  const sendMessage = async () => {
    if (!text.trim() && !mediaUri || !selectedConversation) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("receiverId", partner!._id);
      if (text.trim()) formData.append("text", text.trim());
      if (mediaUri) {
        formData.append("file", { uri: mediaUri, type: mediaMime, name: mediaName } as any);
      }

      const { data } = await api.post<{ success: boolean; message: Message }>(
        "/api/messages/send", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }
      )

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        const target = { receiverId: partner!._id };
        sendWsEvent({ type: "message", ...target, payload: data.message })
      }
    } catch (error) {
      console.log("error in sending message", error)
      Alert.alert("Error", "Failed to send message")
    } finally {
      setSending(false);
      setText("");
      setMediaUri(null);
    }
  }

  const handleCreateDecision = async (question: string, options: string[]) => {
    try {
      const { data } = await api.post<{ success: boolean; message: Message }>(
        "/api/messages/decision",
        {
          receiverId: partner!._id,
          question,
          options
        }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        const target = { receiverId: partner!._id };
        sendWsEvent({ type: "message", ...target, payload: data.message });
      }
    } catch (error) {
      console.log("error creating decision", error);
      Alert.alert("Error", "Failed to create decision");
    }
  };

  const handleVote = async (messageId: string, optionId: string) => {
    try {
      const { data } = await api.post<{ success: boolean; message: Message }>(
        `/api/messages/decision/${messageId}/vote`,
        { optionId }
      );
      if (data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? data.message : m));
        const target = { receiverId: partner!._id };
        sendWsEvent({ type: "message_update", ...target, payload: data.message });
      }
    } catch (error) {
      console.log("error voting", error);
      Alert.alert("Error", "Failed to register vote");
    }
  };

  const handleUpdateContext = async (type: ConversationContextType, contextData?: any) => {
    try {
      const { data } = await api.patch(`/api/messages/conversations/${selectedConversation?._id}/context`, {
        contextType: type,
        context: contextData
      });
      if (data.success) {
        const updatedConv = { ...selectedConversation, contextType: type, context: contextData, status: "active" } as any;
        setSelectedConversation(updatedConv);
        setConversations(prev => 
          prev.map(c => c._id === updatedConv._id ? updatedConv : c)
        );
      }
    } catch (error) {
      console.log("error updating context", error);
      Alert.alert("Error", "Failed to add context");
    }
  };

  if (!selectedConversation) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']} >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={52} color={Colors.outlineVariant} />
          <Text style={styles.emptyText}>
            Conversation not found
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const headerName = partner!.name;
  const headerAvater = partner!.avatar;
  const headerSub = partner!.isOnline ? "Online" : partner?.lastSeen ? `Last seen ${formatTime(partner.lastSeen)}` : "Offline";

  const typingEntries = Object.entries(typingUsers).filter(([uid,
    isTyping]) => {
    if (!isTyping || uid === auth.user?._id) return false;
    return partner?._id === uid
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>

        <Avatar name={headerName} src={headerAvater} size={37} online={partner?.isOnline} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {headerName}
            <Text style={styles.headerHandle}>@{partner?.handle}</Text>
          </Text>
          <Text style={[styles.headerSub, partner?.isOnline && { color: Colors.online }]}>
            {headerSub}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {selectedConversation.contextType && selectedConversation.contextType !== "chat" ? (
            <TouchableOpacity style={styles.backBtn} onPress={toggleContextStatus}>
              <Ionicons 
                name={selectedConversation.status === "completed" ? "checkmark-done-circle" : "checkmark-circle-outline"} 
                size={22} 
                color={selectedConversation.status === "completed" ? Colors.primary : Colors.onSurfaceVariant} 
              />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => setContextModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn}>
                <Ionicons name="call-outline" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn}>
                <Ionicons name="videocam-outline" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={deleteChat}>
            <Ionicons name="trash-outline" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contextual Header */}
      <ContextHeader 
        contextType={selectedConversation.contextType || "chat"} 
        context={selectedConversation.context} 
        participantCount={2} 
        status={selectedConversation.status}
      />

      {/* main */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m._id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item: msg, index }) => {
              const isMine = msg.sender === auth.user?._id;
              const prev = messages[index - 1];
              const showGap = !prev || prev.sender !== msg.sender;

              return (
                <View style={showGap && index > 0 ? { marginTop: 10 } : {}}>
                  <ChatBubble isMine={isMine} msg={msg} onVote={handleVote} />
                </View>
              )
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Typing indicator */}
        {typingEntries.length > 0 && (
          <View style={styles.typingRow}>
            {typingEntries.map(([uid]) => {
              const u = users.find((x) => x._id === uid) || partner;
              return (
                <Text key={uid} style={styles.typingText}>
                  {u?.name || "Someone"} is typing...
                </Text>
              )
            })}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Media preview */}
          {mediaUri && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: mediaUri }} style={styles.mediaThumb} />
              <TouchableOpacity style={styles.mediaRemove} onPress={() =>
                setMediaUri(null)}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setDecisionModalVisible(true)}>
              <Ionicons name="git-network-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={pickMedia}>
              <Ionicons name="image-outline" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TextInput style={[styles.textInput, { outline: "none" }]}
              value={text}
              onChangeText={handleTyping}
              placeholder="Message..."
              placeholderTextColor={Colors.outlineVariant}
              multiline
              maxLength={2000} />
            {/* Send button  */}

            <TouchableOpacity disabled={!text.trim() && !mediaUri || sending}
              activeOpacity={0.85} onPress={sendMessage}>
              <LinearGradient colors={[Colors.primary, Colors.primaryContainer]}
                style={[styles.sendBtn, !text.trim() && !mediaUri && styles.
                  sendBtnDisabled]}>
                {sending ? (
                  <ActivityIndicator color="fff" size="small" />
                ) : (
                  <Ionicons name='send' size={16} color="fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
      <DecisionCreationModal
        visible={decisionModalVisible}
        onClose={() => setDecisionModalVisible(false)}
        onCreate={handleCreateDecision}
      />
      <ContextCreationModal
        visible={contextModalVisible}
        onClose={() => setContextModalVisible(false)}
        onCreate={handleUpdateContext}
        isUpdate={true}
      />
    </SafeAreaView>
  )
}