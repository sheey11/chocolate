import { GET, POST } from "@/api/v1/api"
import { ChatStat, ChatStats, ChatStatsResponse, ClientInformation, ClientResponse, RoomStatsResponse, StreamInformation, StreamResponse, SummaryObject, SummaryResponse, UserNumResponse, VersionResponse } from "./datatypes"

export interface SummaryArray {
    time: string[]
    self: {
        version: string[]
        pid: number[]
        ppid: number[]
        argv: string[]
        cwd: string[]
        mem_kbyte: number[]
        mem_percent: number[]
        cpu_percent: number[]
        srs_uptime: number[]
    }
    system: {
        cpu_percent: number[]
        disk_read_KBps: number[]
        disk_write_KBps: number[]
        mem_ram_kbyte: number[]
        men_ram_percent: number[]
        mem_swap_kbyte: number[]
        men_swap_percent: number[]
        cpus: number[]
        cpus_online: number[]
        uptime: number[]
        idle_time: number[]
        load_1m: number[]
        load_5m: number[]
        load_15m: number[]
        net_sample_time: number[]
        net_recv_bytes: number[]
        net_send_bytes: number[]
        net_recvi_bytes: number[]
        net_sendi_bytes: number[]
        srs_sample_time: number[]
        srs_recv_bytes: number[]
        srs_send_bytes: number[]
        conn_sys: number[]
        conn_sys_et: number[]
        conn_sys_tw: number[]
        conn_sys_udp: number[]
        conn_srs: number[]
    }
}

function transposeSummary(summaryResponses: SummaryObject[]): SummaryArray {
    // author: ChatGPT

    // return Object.fromEntries<SummaryArray>(
    //     Object.entries<string | number | Object>(arr[0]).map(([key, value]) => [
    //         key,
    //         typeof value === "object"
    //             ? Object.fromEntries(
    //                 Object.entries<string | number | Object>(value).map(([subKey]) => [
    //                     subKey,
    //                     arr.map((summary: any) => summary[key][subKey]),
    //                 ])
    //             )
    //             : arr.map((summary: any) => summary[key]),
    //     ])
    // )
    return {
        time: summaryResponses.map((sr: SummaryObject) => new Date(sr.now_ms * 1000).toLocaleTimeString("en-UK")),
        self: {
            version: summaryResponses.map((sr: SummaryObject) => sr.self.version),
            pid: summaryResponses.map((sr: SummaryObject) => sr.self.pid),
            ppid: summaryResponses.map((sr: SummaryObject) => sr.self.ppid),
            argv: summaryResponses.map((sr: SummaryObject) => sr.self.argv),
            cwd: summaryResponses.map((sr: SummaryObject) => sr.self.cwd),
            mem_kbyte: summaryResponses.map((sr: SummaryObject) => sr.self.mem_kbyte),
            mem_percent: summaryResponses.map((sr: SummaryObject) => sr.self.mem_percent),
            cpu_percent: summaryResponses.map((sr: SummaryObject) => sr.self.cpu_percent),
            srs_uptime: summaryResponses.map((sr: SummaryObject) => sr.self.srs_uptime),
        },
        system: {
            cpu_percent: summaryResponses.map((sr: SummaryObject) => sr.system.cpu_percent),
            disk_read_KBps: summaryResponses.map((sr: SummaryObject) => sr.system.disk_read_KBps),
            disk_write_KBps: summaryResponses.map((sr: SummaryObject) => sr.system.disk_write_KBps),
            mem_ram_kbyte: summaryResponses.map((sr: SummaryObject) => sr.system.mem_ram_kbyte),
            men_ram_percent: summaryResponses.map((sr: SummaryObject) => sr.system.men_ram_percent),
            mem_swap_kbyte: summaryResponses.map((sr: SummaryObject) => sr.system.mem_swap_kbyte),
            men_swap_percent: summaryResponses.map((sr: SummaryObject) => sr.system.men_swap_percent),
            cpus: summaryResponses.map((sr: SummaryObject) => sr.system.cpus),
            cpus_online: summaryResponses.map((sr: SummaryObject) => sr.system.cpus_online),
            uptime: summaryResponses.map((sr: SummaryObject) => sr.system.uptime),
            idle_time: summaryResponses.map((sr: SummaryObject) => sr.system.ilde_time),
            load_1m: summaryResponses.map((sr: SummaryObject) => sr.system.load_1m),
            load_5m: summaryResponses.map((sr: SummaryObject) => sr.system.load_5m),
            load_15m: summaryResponses.map((sr: SummaryObject) => sr.system.load_15m),
            net_sample_time: summaryResponses.map((sr: SummaryObject) => sr.system.net_sample_time),
            net_recv_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.net_recv_bytes),
            net_send_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.net_send_bytes),
            net_recvi_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.net_recvi_bytes),
            net_sendi_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.net_sendi_bytes),
            srs_sample_time: summaryResponses.map((sr: SummaryObject) => sr.system.srs_sample_time),
            srs_recv_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.srs_recv_bytes),
            srs_send_bytes: summaryResponses.map((sr: SummaryObject) => sr.system.srs_send_bytes),
            conn_sys: summaryResponses.map((sr: SummaryObject) => sr.system.conn_sys),
            conn_sys_et: summaryResponses.map((sr: SummaryObject) => sr.system.conn_sys_et),
            conn_sys_tw: summaryResponses.map((sr: SummaryObject) => sr.system.conn_sys_tw),
            conn_sys_udp: summaryResponses.map((sr: SummaryObject) => sr.system.conn_sys_udp),
            conn_srs: summaryResponses.map((sr: SummaryObject) => sr.system.conn_srs),
        },
    };
}

export interface HostInformation {
    time: string[]
    network_inbound: number[]
    network_outbound: number[]
    cpu_count: number
    cpu_load: number[]
    cpu: number[]
    mem: number[]
    disk_read: number[]
    disk_write: number[]
    num_conn: number[]
}

function diff(arr: number[], sample_internval: number = 1): number[] {
    return arr.slice(1).map((v, i) => (v - arr[i]) / sample_internval)
}

function splitSummary(summary: SummaryArray): HostInformation {
    const sample_internval = 30
    return {
        time: summary.time,
        network_inbound:  diff(summary.system.net_recvi_bytes, sample_internval),
        network_outbound: diff(summary.system.net_sendi_bytes, sample_internval),
        cpu_count:        summary.system.cpus[0],
        cpu_load:         summary.system.load_1m,
        // cpu:              summary.system.cpu_percent.map((v, i) => v + summary.self.cpu_percent[i]),
        cpu:              summary.system.cpu_percent,
        mem:              summary.self.mem_kbyte,
        disk_read:        summary.system.disk_read_KBps,
        disk_write:       summary.system.disk_write_KBps,
        num_conn:         summary.system.conn_sys
    }
}

export async function fetchVersion(): Promise<VersionResponse> {
    return GET<VersionResponse>(`/api/v1/stats/version`)
}

export async function fetchHostInformation(): Promise<HostInformation> {
    return new Promise(async (resolve, reject) => {
        try {
            const sr = await GET<SummaryResponse>(`/api/v1/stats/summaries`)
            const sa = transposeSummary(sr.summary.filter(s => s != null))
            const info = splitSummary(sa)
            resolve(info)
        } catch (e) {
            reject(e)
        }
    })
}

export async function fetchStreamInformation(): Promise<StreamInformation> {
    return new Promise(async (resolve, reject) => {
        try {
            const sr = await GET<StreamResponse>(`/api/v1/stats/streams`)
            sr.streams = sr.streams.filter(v => v != null)
            const info: StreamInformation = {
                num_streams: sr.streams.at(-1)!.streams.length,
                time: sr.streams.map((s) => new Date(s.sample_time * 1000).toLocaleTimeString('en-UK')),
                samples: sr.streams,
            }
            resolve(info)
        } catch (e) {
            reject(e)
        }
    })
}

export async function fetchClientInformation(): Promise<ClientInformation> {
    return new Promise(async (resolve, reject) => {
        try {
            const sr = await GET<ClientResponse>(`/api/v1/stats/clients`)
            sr.clients = sr.clients.filter(v => v != null)
            const info: ClientInformation = {
                num_clients: sr.clients.at(-1)!.clients.length,
                time: sr.clients.map((s) => new Date(s.sample_time * 1000).toLocaleTimeString('en-UK')),
                samples: sr.clients,
            }
            resolve(info)
        } catch (e) {
            reject(e)
        }
    })
}

export async function fetchUserNum(): Promise<number> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<UserNumResponse>(`/api/v1/stats/users`)
            resolve(response.users_num)
        } catch (e) {
            reject(e)
        }
    })
}

export async function fetchChatStat(): Promise<ChatStats> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<ChatStatsResponse>(`/api/v1/stats/chats`)
            const chats = response.chats.filter(c => c != null)
            const stat: ChatStats = {
                times: chats.map((v) => (new Date(v.time)).toLocaleTimeString('en-UK')),
                nums:  chats.map((v) => v.num),
            }
            resolve(stat)
        } catch (e) {
            reject(e)
        }
    })
}

export async function fetchRoomStats(): Promise<RoomStatsResponse> {
    return GET<RoomStatsResponse>(`/api/v1/stats/rooms`)
}
