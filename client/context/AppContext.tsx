import { AuthState, Conversation, Message, User, UserStory, WsEvent, Notification } from "@/assets/types/index";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import axios from 'axios'
import { API_BASE_URL, WS_URL } from "@/constants/config";
import { useAuth, useUser } from "@clerk/expo";

export const api = axios.create({ baseURL: API_BASE_URL })

const _tokenRef = { current: null as string | null }

interface AppContextType {
    auth: AuthState;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    userStories: UserStory[];
    setUserStories: React.Dispatch<React.SetStateAction<UserStory[]>>
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
    selectedConversation: Conversation | null;
    setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>

    fetchStories: () => Promise<void>
    typingUsers: Record<string, boolean>; // user id -> true if typing
    setTypingUsers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    onlineUsers: Record<string, boolean>;
    setOnlineUsers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    sendWsEvent: (data: object) => void;
 
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>> //equals :(value: User[] | ((prev: User[]) => User[])) => void

    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    fetchNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {

    const [auth, setAuth] = useState<AuthState>({ token: null, user: null, loading: true });
    const [users, setUsers] = useState<User[]>([]);
    const { getToken, isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
    const { user: clerkUser, isLoaded: userLoaded } = useUser();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const selectedConversationRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userStories, setUserStories] = useState<UserStory[]>([]);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);



    const getTokenRef = useRef(getToken);
    // Debounce timer for conversation refetch triggered by incoming messages
    const refetchConvsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken])

    useEffect(() => {
        selectedConversationRef.current = selectedConversation?._id || null;
    }, [selectedConversation])

    //attach clerk token on every request;
    useEffect(() => {
        const interceptor = api.interceptors.request.use(async (config) => {
            try {
                if (isSignedIn) {
                    const token = await getTokenRef.current();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                        _tokenRef.current = token;
                    }

                }
            } catch (error) {
                console.log("Excuse interceptor error ", error)
            }
            return config;
        });

        return () => {
            api.interceptors.request.eject(interceptor)
        }
    }, [isSignedIn]);

    //keep local AuthState in sync with Clerk profile state
    useEffect(() => {
        if (!authLoaded || !userLoaded) {
            return;
        }
        if (isSignedIn && clerkUser) {
            const mappedUser: User = {
                _id: clerkUser.id,
                name: clerkUser.fullName || "Anonymous",
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                handle: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress.
                    split("@")[0] || clerkUser.id,
                avatar: clerkUser.imageUrl || "",
                bio: (clerkUser.publicMetadata?.bio as string) || "Hey there! I am using Veya.",
                isOnline: true,
                lastSeen: new Date().toISOString(),
            }
            setAuth({ token: _tokenRef.current, user: mappedUser, loading: false })
        } else {
            setAuth({ token: null, user: null, loading: false })
        }

    }, [isSignedIn, authLoaded, userLoaded, clerkUser])


    const logout = useCallback(async () => {
        _tokenRef.current = null;
        wsRef.current?.close();
        wsRef.current = null;
        await signOut();
        setAuth({ token: null, user: null, loading: false })
        setConversations([]);
        setMessages([]);
        setSelectedConversation(null)
        setUserStories([])
        setTypingUsers({})
        setNotifications([])
        setUnreadCount(0)

    }, []);

    const updateUser = useCallback(async (user: User) => {
        setAuth((prev) => ({ ...prev, user }))
    }, []);

    const fetchStories = useCallback(async (attempt = 0) => {
        try {
            const { data } = await api.get("/api/stories");
            if (data.success) setUserStories(data.stories);
        } catch {
            // Exponential back-off: 1 s, 2 s, 4 s … capped at 30 s (max 6 retries)
            const delay = Math.min(1000 * 2 ** attempt, 30_000);
            if (attempt < 6) setTimeout(() => fetchStories(attempt + 1), delay);
        }
    }, [])

    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const { data } = await api.get("/api/notifications");
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            // ignore
        }
    }, [isSignedIn])

    useEffect(() => {
        if (isSignedIn && authLoaded && userLoaded) {
            fetchNotifications();
        }
    }, [isSignedIn, authLoaded, userLoaded, fetchNotifications])

    const sendWsEvent = useCallback((data: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, [])

    /** Debounced conversation list refetch — collapses multiple rapid triggers into one. */
    const scheduleConvRefetch = useCallback(() => {
        if (refetchConvsTimerRef.current) clearTimeout(refetchConvsTimerRef.current);
        refetchConvsTimerRef.current = setTimeout(async () => {
            try {
                const { data } = await api.get("/api/messages/conversations");
                if (data.success) setConversations(data.conversations);
            } catch { /* ignore */ }
        }, 300);
    }, [])

    // WebSocket lifecycle secured with dynamic Clerk token
    useEffect(() => {
        if (!isSignedIn || !authLoaded || !userLoaded) {
            wsRef.current?.close()
            return;
        }

        let isMounted = true;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let ws: WebSocket | null = null;
        const connectWs = async () => {
            retryTimer = null;
            try {
                const token = await getTokenRef.current();
                if (!token || !isMounted) return;

                ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
                wsRef.current = ws;

                ws.onmessage = (e) => {
                    const event: WsEvent = JSON.parse(e.data);

                    if (event.type === "message") {
                        const incoming = event.payload as Message;
                        setMessages((prev) => {
                            if (selectedConversationRef.current === incoming.conversationId) {
                                return [...prev, incoming]
                            }
                            return prev;
                        });
                        setConversations((prev) => {
                            const exists = prev.some((c) => c._id === incoming.conversationId);
                            if (!exists) {
                                // Debounce the refetch to avoid parallel HTTP races
                                scheduleConvRefetch();
                                return prev;
                            }
                            return prev.map((c) => c._id === incoming.conversationId ? { ...c, lastMessage: incoming, updatedAt: incoming.createdAt } : c).sort
                                ((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        })
                    }
                    if (event.type === "message_update") {
                        const updatedMessage = event.payload as Message;
                        setMessages((prev) => {
                            if (selectedConversationRef.current === updatedMessage.conversationId) {
                                return prev.map(m => m._id === updatedMessage._id ? updatedMessage : m);
                            }
                            return prev;
                        });
                    }
                    if (event.type === "typing") {
                        const { senderId, isTyping } = event;
                        if (senderId && isTyping !== undefined) {
                            setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }))
                        }
                    }
                    if (event.type === "online_status") {
                        const { userId, isOnline } = event;
                        if (userId && isOnline !== undefined) {
                            setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
                            setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isOnline } : u)));
                            setConversations((prev) => prev.map((c) => {
                                if (c.participant?._id === userId) {
                                    return { ...c, participant: { ...c.participant, isOnline } }
                                }
                                return c;
                            }))
                        }
                    }
                    if (event.type === "user_update") {
                        const updated = event.user as User;
                        if (updated) {
                            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
                            setConversations((prev) =>
                                prev.map((c) => (c.participant?._id === updated._id ? { ...c, participant: updated } : c))
                            );
                            setSelectedConversation((prev) => {
                                if (prev && prev.participant?._id === updated._id) {
                                    return { ...prev, participant: updated }
                                }
                                return prev;
                            })
                            setUserStories((prev) => prev.map((us) => (us.user._id === updated._id ? { ...us, user: updated } : us)))
                        }
                    }
                    if (event.type === "chat_deleted") {
                        const { conversationId } = event;
                        if (conversationId) {
                            setConversations((prev) => prev.filter((c) => c._id !== conversationId));
                            setSelectedConversation((prev) => (prev?._id === conversationId ? null : prev))
                        }
                    }
                    if (event.type === "notification") {
                        const notif = event.payload as Notification;
                        setNotifications((prev) => [notif, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                    if (event.type === "read_receipt") {
                        const { conversationId } = event;
                        // Mark all messages in that conversation as read locally
                        setMessages((prev) =>
                            prev.map(m => m.conversationId === conversationId ? { ...m, read: true } : m)
                        );
                    }
                }
                ws.onerror = () => ws?.close()
                ws.onclose = () => {
                    wsRef.current = null;
                    if (isMounted) {
                        retryTimer = setTimeout(connectWs, 3000);
                    }
                }
            } catch (error) {
                console.error("Ws connection failed", error)
                if (isMounted) {
                    retryTimer = setTimeout(connectWs, 3000);
                }
            }
        }
        connectWs();

        // Handle AppState changes to reconnect when coming to foreground
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
                connectWs();
            }
        };
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            isMounted = false;
            if (retryTimer) clearTimeout(retryTimer); // cancel pending reconnect
            appStateSubscription.remove();
            ws?.close();
            wsRef.current = null;
        }
    }, [isSignedIn, authLoaded, userLoaded])

    return (
        <AppContext.Provider value={{
            auth, logout, updateUser, userStories, setUserStories,
            conversations, setConversations, selectedConversation, setSelectedConversation, messages, setMessages,
            fetchStories, typingUsers, setTypingUsers, onlineUsers, setOnlineUsers, sendWsEvent, users, setUsers,
            notifications, setNotifications, fetchNotifications, unreadCount, setUnreadCount
        }}>
            {children}
        </AppContext.Provider>
    )
}
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside AppProvider")
    return ctx;
}
