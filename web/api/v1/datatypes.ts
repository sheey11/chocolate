export interface MidifyRoomPermission {
    permission_type: "blacklist" | "whitelist"
    clear_previous: boolean
}

export interface PasswordAuthenticate {
    username: string
    password: string
}

export interface RoleModification {
    role: string
}

export interface PasswordModification {
    password: string
}
