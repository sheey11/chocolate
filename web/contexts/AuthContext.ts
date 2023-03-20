import { createContext } from "react";
import { AuthResult } from "@/api/v1/account"
import { User } from "@/hooks/useAuth";

interface AuthContext {
    authenticated: boolean,
    getUser: () => User | null,
    login: (username: string, password: string) => Promise<AuthResult>,
    logout: () => void,
}

export const AuthContext = createContext<AuthContext>({
    authenticated: false,
    getUser: () => null,
    login: (username: string, password: string) => { return new Promise((r) => r({ ok: false, user: null, accessToken: "" })) },
    logout: () => {},
})

