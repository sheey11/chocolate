import { GET, POST } from "@/api/v1/api"
import { RoomInfoResponse } from "./datatypes"

export async function fetchRoomInfo(id: number): Promise<RoomInfoResponse> {
    return GET<RoomInfoResponse>(`/api/v1/rooms/${id}`)
}

