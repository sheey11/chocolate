import axios, { AxiosError } from 'axios'

const getAccessToken = () => {
    const str = localStorage.getItem('access-token')
    if (str != null) {
        return JSON.parse(str)
    } else {
        return ""
    }
}

export const api = axios.create({
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

