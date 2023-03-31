import axios, { AxiosError } from 'axios'

const getAccessToken = () => {
    const str = localStorage.getItem('access_token')
    if (str != null) {
        return JSON.parse(str)
    } else {
        return ""
    }
}

export const api = axios.create({
    baseURL: "http://localhost", // only for debug
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token && token != "") {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

