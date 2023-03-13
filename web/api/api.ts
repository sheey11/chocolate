import axios, { AxiosError } from 'axios'

const getAccessToken = () => localStorage.getItem('access_token')

export const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})
