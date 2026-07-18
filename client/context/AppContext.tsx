import { AuthState, User } from "@/assets/types";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";

interface AppContextType {
    auth: AuthState;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {

    const [auth, setAuth] = useState<AuthState>({ token: null, user: null, loading: true });
    const [users, setUsers] = useState<User[]>([]);
    
    const logout = useCallback(async () => {

    }, []);

    const updateUser = useCallback(async () => {

    }, []);

    return (
        <AppContext.Provider value={{ auth, logout, updateUser }}>
            {children}
        </AppContext.Provider>
    )
}
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside AppProvider")
    return ctx;
}