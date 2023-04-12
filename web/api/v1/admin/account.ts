import { GET } from "../api"
import { AdminAccountDetail, AdminAccountDetailResponse, AdminListAccountsResponse, ListRoleResponse } from "../datatypes"

interface fetchAccountOptions {
    role?: string
    search?: string
    limit?: number
    page?: number
}
export function fetchAccounts(options: fetchAccountOptions): Promise<AdminListAccountsResponse> {
    return GET<AdminListAccountsResponse>("/api/v1/admin/account/", options)
}

export function fetchRoles(): Promise<ListRoleResponse> {
    return GET<ListRoleResponse>("/api/v1/admin/roles")
}

export function fetchAccountDetail(username: string): Promise<AdminAccountDetailResponse> {
    return GET<AdminAccountDetailResponse>(`/api/v1/admin/account/${username}`)
}