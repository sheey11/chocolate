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
    code: number;
    server: string;
    service: string;
    pid: string;
    now_ms: number;
    self: {
        version: string;
        pid: number;
        ppid: number;
        argv: string;
        cwd: string;
        mem_kbyte: number;
        mem_percent: number;
        cpu_percent: number;
        srs_uptime: number;
    };
    system: {
        cpu_percent: number;
        disk_read_KBps: number;
        disk_write_KBps: number;
        mem_ram_kbyte: number;
        men_ram_percent: number;
        mem_swap_kbyte: number;
        men_swap_percent: number;
        cpus: number;
        cpus_online: number;
        uptime: number;
        ilde_time: number;
        load_1m: number;
        load_5m: number;
        load_15m: number;
        net_sample_time: number;
        net_recv_bytes: number;
        net_send_bytes: number;
        net_recvi_bytes: number;
        net_sendi_bytes: number;
        srs_sample_time: number;
        srs_recv_bytes: number;
        srs_send_bytes: number;
        conn_sys: number;
        conn_sys_et: number;
        conn_sys_tw: number;
        conn_sys_udp: number;
        conn_srs: number;
    };
}

export interface SummaryResponse extends ChocolcateResponse {
    summary: []
}
