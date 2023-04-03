export interface ChocolcateResponse {
    code: number
    message: string
}

export interface MidifyRoomPermissionPayload {
    permission_type: "blacklist" | "whitelist"
    clear_previous: boolean
}

export interface PasswordAuthenticatePayload {
    username: string
    password: string
}

export interface RoleModificationPayload {
    role: string
}

export interface PasswordModificationPayload {
    password: string
}

export interface OwnedRoomInformation {
    id: string
    permission_type: string
    status: string
    title: string
    uid: string
    viewers: number
}

export interface AuthResponse extends ChocolcateResponse {
    jwt: string
    role: string
    username: string
}

export interface SelfInfoResponse extends ChocolcateResponse {
    id: number
    labels: string[]
    max_rooms: number
    role: string
    rooms: OwnedRoomInformation[]
    session_expire: Date
    username: string
}

export interface RoomInfoResponse extends ChocolcateResponse {
    id: number
    playback: {
        flv: string
        hls: string
    }
    status: string
    title: string
    viewers: number
}

