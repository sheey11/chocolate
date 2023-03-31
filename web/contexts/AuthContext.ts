import { createContext } from "react";
import { User } from "@/hooks/useAuth";
import { AuthResponse } from "@/api/v1/account";

interface AuthContext {
    authenticated: boolean,
    getUser: () => User | null,
    signin: (username: string, password: string) => Promise<AuthResponse>,
    signout: () => void,
}

export const AuthContext = createContext<AuthContext>({
    authenticated: false,
    getUser: () => null,
    signin: (_: string, __: string) => { return new Promise((_, reject) => reject("not implemented")) },
    signout: () => {},
})

