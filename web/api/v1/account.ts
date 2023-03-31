import { GET, POST } from "@/api/v1/api"
import { ChocolcateResponse, PasswordAuthenticatePayload, SelfInfoResponse } from "./datatypes"

export async function fetchCurrentUserInfo(): Promise<SelfInfoResponse> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<SelfInfoResponse>('/api/v1/user/me')
            resolve(response)
        } catch(e) {
            reject(e)
        }
    })
}

export interface AuthResponse extends ChocolcateResponse {
    jwt: string
    role: string
    username: string
}

export async function passwordAuth(username: string, password: string): Promise<AuthResponse> {
    const payload = {
        username,
        password,
    }
    return POST<PasswordAuthenticatePayload, AuthResponse>('/api/v1/auth/password', payload)
}

