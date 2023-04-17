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
    id: number
    permission_type: "whitelist" | "blacklist"
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
    last_streaming: string
    playback: {
        flv: string
        hls: string
    }
    status: string
    title: string
    viewers: number
}

export interface OwnedRoomInfoResponse extends RoomInfoResponse {
    uid: string
    permission_type: "whitelist" | "blacklist"
    permission_items: {
        type: "user" | "label"
        label: string | null
        user_id: number | null
        username: string | null
    }[]
}

export interface VersionResponse extends ChocolcateResponse {
    version: {
        major: number
        minor: number
        revision: number
        server: string
        service: string
    }
}

export interface SummaryObject {
    code: number
    server: string
    service: string
    pid: string
    now_ms: number
    self: {
        version: string
        pid: number
        ppid: number
        argv: string
        cwd: string
        mem_kbyte: number
        mem_percent: number
        cpu_percent: number
        srs_uptime: number
    }
    system: {
        cpu_percent: number
        disk_read_KBps: number
        disk_write_KBps: number
        mem_ram_kbyte: number
        men_ram_percent: number
        mem_swap_kbyte: number
        men_swap_percent: number
        cpus: number
        cpus_online: number
        uptime: number
        ilde_time: number
        load_1m: number
        load_5m: number
        load_15m: number
        net_sample_time: number
        net_recv_bytes: number
        net_send_bytes: number
        net_recvi_bytes: number
        net_sendi_bytes: number
        srs_sample_time: number
        srs_recv_bytes: number
        srs_send_bytes: number
        conn_sys: number
        conn_sys_et: number
        conn_sys_tw: number
        conn_sys_udp: number
        conn_srs: number
    }
}

export interface SummaryResponse extends ChocolcateResponse {
    summary: []
}

export interface Stream {
    ID: string
    Name: string
    vhost: string
    App: string
    tcUrl: string
    url: string
    live_ms: number
    clients: number
    frames: number
    send_bytes: number
    recv_bytes: number
    kbps: {
        recv_30s: number
        send_30s: number
    }
    publish: {
        Active: boolean
        CID: string
    }
    video: {
        Codec: string
        Profile: string
        Level: string
        Width: number
        Height: number
    }
    audio: {
        Codec: string
        sample_rate: number
        Channel: number
        Profile: string
    }
}

export interface StreamSample {
    code: number
    server: string
    service: string
    pid: string
    sample_time: number
    streams: Stream[]
}

export interface StreamResponse extends ChocolcateResponse {
    streams: StreamSample[]
}

export interface StreamInformation {
    time: string[]
    num_streams: number
    samples: StreamSample[]
}

export interface Client {
    ID: string
    vhost: string
    stream: string
    ip: string
    pageUrl: string
    swfUrl: string
    tcUrl: string
    url: string
    name: string
    type: string
    publish: boolean
    alive: number
    send_bytes: number
    recv_bytes: number
    kbps: {
        recv_30s: number
        sned_30s: number
    }
}

export interface ClientSample {
    code: number
    server: string
    service: string
    pid: string
    sample_time: number
    clients: Client[]
}

export interface ClientResponse extends ChocolcateResponse {
    clients: ClientSample[]
}

export interface ClientInformation {
    time: string[]
    num_clients: number
    samples: ClientSample[]
}

export interface UserNumResponse extends ChocolcateResponse {
    users_num: number
}

export interface ChatStat {
    num: number
    time: string
}

export interface ChatStatsResponse extends ChocolcateResponse {
    chats: ChatStat[]
}

export interface RoomStatsResponse extends ChocolcateResponse {
    streaming: number
    total: number
}

export interface ChatStats {
    times: string[]
    nums: number[]
}

export interface RoomAdminInfo {
    id: number
    uid: string
    viewers: number
    title: string
    status: "streaming" | "idle"
    owner_id: number
    owner_username: string
    permission_type: "whitelist" | "blacklist"
    last_streaming: string
}

export interface ListRoomAdminResponse extends ChocolcateResponse {
    rooms: RoomAdminInfo[]
    total: number
}

export interface AdminRoomDetailResponse extends ChocolcateResponse {
    rooms: {
        id: number
        uid: string
        viewers: number
        title: string
        status: string
        owner_id: number
        owner_username: string
        permission_type: string
        permission_items: {
            label: string | null
            user_id: number | null
            username: string | null
            type: 'user' | 'label'
        }[]
        last_streaming: string
        srs_stream: null | {
            id: string
            name: string
            vhost: string
            app: string
            live_ms: number
            clients: number
            frames: number
            send_bytes: number
            recv_bytes: number
            kbps: {
                recv_30s: number
                send_30s: number
            }
            publish: {
                active: boolean
                cid: string
            }
            video: {
                codec: string
                profile: string
                level: string
                width: number
                height: number
            }
            audio: {
                codec: string
                sample_rate: number
                channel: number
                profile: string
            }
        }

    }
}

export interface RoomTimelineResponse extends ChocolcateResponse {
    logs: {
        type: number
        subject: string
        time: string
        detail: string
    }[]
}

export interface Role {
    name: string
    abilities: {
        manage_account: boolean
        stream: boolean
        manage_room: boolean
        create_room: boolean
        retrieve_metrics: boolean
    }
}

export interface ListRoleResponse extends ChocolcateResponse {
    roles: Role[]
}

export interface AdminAccountListingInfo {
    id: number
    role: string
    labels: string[]
    username: string
    max_rooms: number
    owned_rooms: number
}

export interface AdminListAccountsResponse extends ChocolcateResponse {
    total: number
    users: AdminAccountListingInfo[]
}

export interface AdminAccountDetail {
    id: number
    role: string
    username: string
    labels: string[]
    max_rooms: number
    rooms: {
        id: number
        permission_type: string
        status: string
        title: string
        uid: string
        viewers: number
    }[]
}

export interface AdminAccountDetailResponse extends ChocolcateResponse {
    user_info: AdminAccountDetail
}

export interface UserCreationInfo {
    username: string,
    password: string,
    role: string,
    labels: string[],
}

export interface CreateUserResponse extends ChocolcateResponse {
    // empty
}

export interface ChatHistory {
    time: string
    type: "chat" | "admin" | "entering_room" | "gift" | "superchat"
    content: string
}

export interface AccountWatchingHistory {
    room_id: number
    room_title: string
    room_owner_id: number
    room_owner_username: string
    start_time: string
    end_time: string
    chats: ChatHistory[]
}

export interface AccountHistoryResponse extends ChocolcateResponse {
    history: AccountWatchingHistory[]
}

export interface AccountHistoryQuery {
    start: number
    end: number
}

export interface RoomAudienceHistory {
    uid: number
    username: string
    enter_time: string
    leave_time: string
    chats: ChatHistory[]
}

export interface RoomHistoryResponse extends ChocolcateResponse {
    history: RoomAudienceHistory[]
}

export interface RoomHistoryQuery {
    start: number
    end: number
}

export interface UserPasswordUpdatePayload {
    password: string
}

export interface StartStreamingResponse extends ChocolcateResponse {
    streamkey: string
}
