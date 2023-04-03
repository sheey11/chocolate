import { GET, POST } from "@/api/v1/api"
import { AuthResponse, PasswordAuthenticatePayload, SelfInfoResponse } from "./datatypes"

export async function fetchCurrentUserInfo(): Promise<SelfInfoResponse> {
    return GET<SelfInfoResponse>('/api/v1/user/me')
}

export async function passwordAuth(username: string, password: string): Promise<AuthResponse> {
    const payload = {
        username,
        password,
    }
    return POST<PasswordAuthenticatePayload, AuthResponse>('/api/v1/auth/password', payload)
}

