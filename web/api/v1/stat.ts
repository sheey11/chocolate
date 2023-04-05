import { GET, POST } from "@/api/v1/api"
import { SummaryObject, SummaryResponse, VersionResponse } from "./datatypes"

export interface SummaryArray {
    now_ms: number[]
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
        now_ms: summaryResponses.map((sr: SummaryObject) => sr.now_ms),
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
    time: number[]
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

function splitSummary(summary: SummaryArray): HostInformation {
    return {
        time: summary.now_ms,
        network_inbound: summary.system.net_recv_bytes,
        network_outbound: summary.system.net_send_bytes,
        cpu_count: summary.system.cpus[0],
        cpu_load: summary.system.load_1m,
        cpu: summary.system.cpu_percent,
        mem: summary.system.men_ram_percent,
        disk_read: summary.system.disk_read_KBps,
        disk_write: summary.system.disk_write_KBps,
        num_conn: summary.system.conn_srs
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


