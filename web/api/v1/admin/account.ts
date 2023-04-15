import { GET, POST } from "../api"
import { AccountHistoryQuery, AccountHistoryResponse, AdminAccountDetail, AdminAccountDetailResponse, AdminListAccountsResponse, CreateUserResponse, ListRoleResponse, UserCreationInfo } from "../datatypes"

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

export function createNewUsers(users: UserCreationInfo[]): Promise<CreateUserResponse> {
    return POST<UserCreationInfo[], CreateUserResponse>(`/api/v1/admin/account/`, users)
}

export function fetchAccountHistory(username: string, query: AccountHistoryQuery): Promise<AccountHistoryResponse> {
    return GET<AccountHistoryResponse>(`/api/v1/admin/account/${username}/history`, query)
}
