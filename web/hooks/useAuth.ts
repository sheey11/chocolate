import { api } from "@/api/api"
import { useState } from "react"
import { useLocalStorage } from "./useLocalStorage"
import * as account from "@/api/v1/account"

export interface User {
    username: string
    role: string,
    max_rooms: number,
    labels: string[],
    session_expire: string,
}

export const useAuth = () => {
    const { getItem: getUser, setItem: setUser, removeItem: removeUser } = useLocalStorage<User>('user')
    const { getItem: getToken, setItem: setToken, removeItem: removeToken} = useLocalStorage<string>('access_token')
    const [authenticated, setAuthenticated] = useState(false)

    const set = (user: User, token: string) => {
        setUser(user)
        setToken(token)
        setAuthenticated(true)
    }

    const remove = () => {
        removeUser()
        removeToken()
        setAuthenticated(false)
    }

    const login = async (username: string, password: string) => {
        return await account.login(username, password)
    }

    const logout = () => {

    }

    return { authenticated, getUser, login, logout }
}
