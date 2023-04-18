import { DELETE, GET, PATCH, PATCH_WithoutData, POST, PUT, PUT_WithoutData } from "@/api/v1/api"
import {
    ChocolcateResponse,
    CreateRoomResponse,
    OwnedRoomInfoResponse,
    PermItemAutoCompleteResponse,
    RoomInfoResponse,
    StartStreamingResponse
} from "./datatypes"

export async function fetchRoomInfo(id: number): Promise<RoomInfoResponse> {
    return GET<RoomInfoResponse>(`/api/v1/rooms/${id}`)
}

export async function fetchOwnedRoomInfo(id: number): Promise<OwnedRoomInfoResponse> {
    return GET<OwnedRoomInfoResponse>(`/api/v1/rooms/${id}`)
}

export async function updateRoomPermissionType(id: number, type: "whitelist" | "blacklist"): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/rooms/${id}/permission-type/${type}`)
}

export async function deleteRoomPermissionItem(id: number, type: "user" | "label", item: string): Promise<ChocolcateResponse> {
    return DELETE<ChocolcateResponse>(`/api/v1/rooms/${id}/permission/${type}/${item}`)
}

export async function addRoomPermissionItem(id: number, type: "user" | "label", item: string): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/rooms/${id}/permission/${type}/${item}`)
}

export async function updateRoomTitle(id: number, title: string): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/rooms/${id}/title/${title}`)
}

export async function startStreaming(id: number): Promise<StartStreamingResponse> {
    return PATCH_WithoutData<StartStreamingResponse>(`/api/v1/rooms/${id}/start-streaming`)
}

export async function stopStreaming(id: number): Promise<StartStreamingResponse> {
    return PATCH_WithoutData<StartStreamingResponse>(`/api/v1/rooms/${id}/stop-streaming`)
}

export async function autoCompletePermItem(id: number, type: "label" | "user", prefix: string): Promise<PermItemAutoCompleteResponse> {
    return GET<PermItemAutoCompleteResponse>(`/api/v1/rooms/${id}/permission/${type}/auto-complete`, { prefix })
}

export async function createRoom(title: string): Promise<CreateRoomResponse> {
    return POST<{ title: string }, CreateRoomResponse>(`/api/v1/rooms/create`, { title })
}

export async function deleteRoom(id: number): Promise<ChocolcateResponse> {
    return DELETE<ChocolcateResponse>(`/api/v1/rooms/${id}`)
}
