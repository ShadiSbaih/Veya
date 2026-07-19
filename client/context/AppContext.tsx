import { AuthState, User } from "@/assets/types";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from 'axios'
import { API_BASE_URL } from "@/constants/config";
import { useAuth, useUser } from "@clerk/expo";

export const api = axios.create({ baseURL: API_BASE_URL })

const _tokenRef = { current: null as string | null }

interface AppContextType {
    auth: AuthState;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    updateAvatar: (uri: string, base64?: string | null) => Promise<string | null>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>> //equals :(value: User[] | ((prev: User[]) => User[])) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {

    const [auth, setAuth] = useState<AuthState>({ token: null, user: null, loading: true });
    const [users, setUsers] = useState<User[]>([]);
    const { getToken, isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
    const { user: clerkUser, isLoaded: userLoaded } = useUser();

    const getTokenRef = useRef(getToken);
    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken])


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
                bio: (clerkUser.publicMetadata?.bio as string) || "Hey there! I am using Risal.",
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
        await signOut();
        setAuth({ token: null, user: null, loading: false })

    }, []);

    const updateUser = useCallback(async (user: User) => {
        setAuth((prev) => ({ ...prev, user }))
    }, []);

    const updateAvatar = useCallback(async (uri: string, base64?: string | null) => {
        if (!clerkUser) return null;
        try {
            let fileToUpload: any;
            
            if (uri.startsWith('data:image')) {
                // Perfect for web, ImagePicker returns a ready-to-use data URI
                fileToUpload = uri;
            } else if (typeof window !== 'undefined' && typeof window.File !== 'undefined') {
                // Web environments without data URI
                const response = await fetch(uri);
                const blob = await response.blob();
                fileToUpload = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
            } else if (base64) {
                // Native environments
                fileToUpload = `data:image/jpeg;base64,${base64}`;
            } else {
                // Fallback for native
                const response = await fetch(uri);
                fileToUpload = await response.blob();
            }

            const updatedImage = await clerkUser.setProfileImage({ file: fileToUpload });
            
            setAuth((prev) => {
                if (!prev.user) return prev;
                return {
                    ...prev,
                    user: { ...prev.user, avatar: updatedImage.publicUrl }
                };
            });
            
            return updatedImage.publicUrl;
        } catch (error) {
            console.error("Failed to update Clerk profile image:", error);
            return null;
        }
    }, [clerkUser]);

    return (
        <AppContext.Provider value={{ auth, logout, updateUser, updateAvatar, users, setUsers }}>
            {children}
        </AppContext.Provider>
    )
}
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside AppProvider")
    return ctx;
}