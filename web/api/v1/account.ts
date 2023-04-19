import { GET, POST, PUT } from "@/api/v1/api"
import { AuthResponse, ChocolcateResponse, PasswordAuthenticatePayload, SelfInfoResponse } from "./datatypes"

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

interface UpdatePasswordPayload {
    old: string
    logout: boolean
}

export function updateAccountPassword(oldPassword: string, newPassword: string, logout: boolean): Promise<ChocolcateResponse> {
    const payload = {
        old: oldPassword,
        logout: logout
    }
    return PUT<UpdatePasswordPayload, ChocolcateResponse>(`/api/v1/user/password/${newPassword}`, payload)
}
