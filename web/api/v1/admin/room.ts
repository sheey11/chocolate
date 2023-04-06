import { GET, POST } from "@/api/v1/api"
import { ListRoomAdminResponse } from "../datatypes"

export interface FetchRoomOptions {
    search?: string,
    status?: 0 | 1,
    limit?: number,
    page?: number,
}

export function fetchRooms({ search, status, limit = 20, page = 1}: FetchRoomOptions): Promise<ListRoomAdminResponse> {
    const params = { search, status, limit, page }
    const params_filtered = Object.entries(params).reduce((a: any, [k, v]) => (v ? (a[k] = v, a) : a), {})
    return new Promise(async (resolve, reject) => {
        try {
            const response = await GET<ListRoomAdminResponse>("/api/v1/admin/room/", params_filtered)
            resolve(response)
        } catch(e) {
            reject(e)
        }
    })
}
