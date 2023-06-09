import { DELETE, GET, POST, PUT, PUT_WithoutData } from "../api"
import { AccountHistoryQuery, AccountHistoryResponse, AdminAccountDetail, AdminAccountDetailResponse, AdminListAccountsResponse, ChocolcateResponse, CreateUserResponse, ListRoleResponse, UserCreationInfo, UserPasswordUpdatePayload } from "../datatypes"

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

export function createNewAccounts(users: UserCreationInfo[]): Promise<CreateUserResponse> {
    return POST<UserCreationInfo[], CreateUserResponse>(`/api/v1/admin/account/`, users)
}

export function fetchAccountHistory(username: string, query: AccountHistoryQuery): Promise<AccountHistoryResponse> {
    return GET<AccountHistoryResponse>(`/api/v1/admin/account/${username}/history`, query)
}

export function deleteAccount(username: string): Promise<ChocolcateResponse> {
    return DELETE<ChocolcateResponse>(`/api/v1/admin/account/${username}`)
}

export function updateAccountRole(username: string, role: string): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/admin/account/${username}/role/${role}`)
}

export function updateAccountMaxRoom(username: string, count: number): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/admin/account/${username}/max-room/${count}`)
}

export function addAccountLabel(username: string, label: string): Promise<ChocolcateResponse> {
    return PUT_WithoutData<ChocolcateResponse>(`/api/v1/admin/account/${username}/label/${label}`)
}

export function deleteAccountLabel(username: string, label: string): Promise<ChocolcateResponse> {
    return DELETE<ChocolcateResponse>(`/api/v1/admin/account/${username}/label/${label}`)
}

export function updateAccountPassword(username: string, password: string): Promise<ChocolcateResponse> {
    return PUT<UserPasswordUpdatePayload, ChocolcateResponse>(`/api/v1/admin/account/${username}/password`, { password })
}

