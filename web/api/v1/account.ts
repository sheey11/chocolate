import { RequestException } from "@/exceptions/exceptions"
import { User } from "@/hooks/useAuth"
import { api } from "../api"

export async function fetchCurrentUserInfo(): Promise<User> {
    const res = await api.get('/api/v1/user/me')
    const code: number = res.data.code
    if (code != 0) {
        throw new RequestException(code, res.data.message)
    }
    return {
        username      : res.data.username,
        role          : res.data.role,
        max_rooms     : res.data.max_rooms,
        labels        : res.data.labels,
        session_expire: res.data.session_expire,
    }
}

export interface AuthResult {
    ok: boolean,
    user: User | null,
    accessToken: string,
}

export async function login(username: string, password: string): Promise<AuthResult> {
    // axios
    
    return {
        ok: true,
        user: await fetchCurrentUserInfo(),
        accessToken: "",
    }
}

