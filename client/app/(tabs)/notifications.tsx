import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from '@/assets/styles/SearchScreen.styles'
import { Colors } from '@/assets/constants/Colors'
import { api, useApp } from '@/context/AppContext'
import Avatar from '@/components/Avatar'
import { formatTime } from '@/utils/formatTime'
import { useRouter } from 'expo-router'

export default function NotificationsScreen() {
    const { notifications, fetchNotifications, setUnreadCount, setNotifications } = useApp()
    const [loading, setLoading] = useState(false)
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
            
            // Mark all as read when opening the screen
            try {
                await api.patch('/api/notifications/read');
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({...n, isRead: true})));
            } catch (err) {}
        }
        load();
    }, [])

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
            </View>
            
            {loading && notifications.length === 0 ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(n) => n._id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.userRow, { backgroundColor: item.isRead ? Colors.surfaceLowest : Colors.surfaceHigh }]} 
                            activeOpacity={0.7}
                            onPress={() => item.conversationId && router.push(`/chat/${item.conversationId}` as any)}
                        >
                            <Avatar name={item.sender?.name || "System"} src={item.sender?.avatar} size={44} />
                            
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { fontWeight: item.isRead ? '400' : '600' }]} numberOfLines={2}>
                                    {item.content}
                                </Text>
                                <Text style={styles.userEmail}>{formatTime(item.createdAt)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60, gap: 16 }}>
                            <Image 
                                source={require('@/assets/images/empty-notifications-v2.png')} 
                                style={{ width: 340, height: 340, resizeMode: 'contain' }} 
                            />
                            <Text style={{ fontSize: 20, fontWeight: '600', color: Colors.onSurface, letterSpacing: -0.5, marginTop: -20 }}>
                                No notifications yet
                            </Text>
                            <Text style={{ fontSize: 15, color: Colors.onSurfaceVariant }}>
                                You're all caught up!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    )
}
