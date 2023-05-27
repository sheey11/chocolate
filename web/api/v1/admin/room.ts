import { GET, PATCH, POST, DELETE } from "@/api/v1/api"
import { resourceUsage } from "process"
import { AdminRoomDetailResponse, ChocolcateResponse, ListRoomAdminResponse, RoomChatCompact, RoomHistoryQuery, RoomHistoryResponse, RoomTimelineResponse } from "../datatypes"

export interface FetchRoomOptions {
    search?: string,
    status?: 0 | 1,
    limit?: number,
    page?: number,
}

export function fetchRooms({ search, status, limit = 10, page = 1}: FetchRoomOptions): Promise<ListRoomAdminResponse> {
    const params = { search, status, limit, page }
    // filter null, undefined, empty array etc. items
    const params_filtered = Object.entries(params).reduce((a: any, [k, v]) => (v || v === 0 ? (a[k] = v, a) : a), {})
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<ListRoomAdminResponse>("/api/v1/admin/room/", params_filtered)
            resolve(response)
        } catch(e) {
            reject(e)
        }
    })
}

export function fetchRoomDetail(id: string): Promise<AdminRoomDetailResponse> {
    return GET<AdminRoomDetailResponse>(`/api/v1/admin/room/${id}`)
}

export function fetchRoomTimeline(id: string): Promise<RoomTimelineResponse> {
    return GET<RoomTimelineResponse>(`/api/v1/admin/room/${id}/timeline`)
}

export function cutoffRoomStream(id: string): Promise<ChocolcateResponse> {
    return PATCH<undefined, ChocolcateResponse>(`/api/v1/admin/room/${id}/cutoff`, undefined)
}

export function deleteRoom(id: string): Promise<ChocolcateResponse> {
    return DELETE<ChocolcateResponse>(`/api/v1/admin/room/${id}`)
}

export function fetchRoomHistory(id: number, query: RoomHistoryQuery): Promise<RoomChatCompact[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<RoomHistoryResponse>(`/api/v1/admin/room/${id}/history`, query)
            const result: RoomChatCompact[] = []
            response.history.forEach((history) => {
                result.push({
                    username: history.username,
                    uid: history.uid,
                    type: 'entering_room',
                    time: history.enter_time,
                    content: "",
                })
                
                history.chats.forEach(c => {
                    result.push({
                        username: history.username,
                        uid: history.uid,
                        type: c.type,
                        time: c.time,
                        content: c.content,
                    })
                })

                result.push({
                    username: history.username,
                    uid: history.uid,
                    type: 'leaving_room',
                    time: history.enter_time,
                    content: "",
                })
            })
            result.sort((a: RoomChatCompact, b: RoomChatCompact) => {
                return (new Date(a.time) as unknown as number) - (new Date(b.time) as unknown as number)
            })
            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}
