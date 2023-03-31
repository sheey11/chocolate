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

export interface SelfInfoResponse extends ChocolcateResponse {
    id: number
    labels: string[]
    max_rooms: number
    role: string
    rooms: OwnedRoomInformation[]
    session_expire: Date
    username: string
}
