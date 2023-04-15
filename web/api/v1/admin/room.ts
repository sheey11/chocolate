import { GET, PATCH, POST, DELETE } from "@/api/v1/api"
import { AdminRoomDetailResponse, ChocolcateResponse, ListRoomAdminResponse, RoomHistoryQuery, RoomHistoryResponse, RoomTimelineResponse } from "../datatypes"

export interface FetchRoomOptions {
    search?: string,
    status?: 0 | 1,
    limit?: number,
    page?: number,
}

export function fetchRooms({ search, status, limit = 10, page = 1}: FetchRoomOptions): Promise<ListRoomAdminResponse> {
    const params = { search, status, limit, page }
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

export function fetchRoomHistory(username: string, query: RoomHistoryQuery): Promise<RoomHistoryResponse> {
    return GET<RoomHistoryResponse>(`/api/v1/admin/account/${username}/history`, query)
}
