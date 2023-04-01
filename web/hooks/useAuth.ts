import { useState } from "react"
import { useLocalStorage } from "./useLocalStorage"
import * as accountApis from "@/api/v1/account"

export interface User {
    username: string
    role: string,
    max_rooms: number,
    labels: string[],
    session_expire: Date,
}

export const useAuth = () => {
    const { getItem: getUser, setItem: setUser, removeItem: removeUser } = useLocalStorage<User>('user')
    const { setItem: setToken, removeItem: removeToken} = useLocalStorage<string>('access_token')
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

    const signin = async (username: string, password: string): Promise<accountApis.AuthResponse> => {
        return new Promise(async (resolve, reject) => {
            accountApis.passwordAuth(username, password)
                .then(async (response) => {
                    setToken(response.jwt)

                    let info = await accountApis.fetchCurrentUserInfo()
                    const user: User = {
                        username:       info.username,
                        role:           info.role,
                        max_rooms:      info.max_rooms,
                        labels:         info.labels,
                        session_expire: info.session_expire,
                    }
                    set(user, response.jwt)
                    resolve(response)
                })
                .catch((e) =>{
                    remove()
                    reject(e)
                })
        })
    }

    const signout = () => {
        remove()
    }

    return { authenticated, getUser, signin, signout }
}
