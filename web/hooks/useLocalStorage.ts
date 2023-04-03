import { isServerSide } from "@/utils/server"
import { useCallback, useState } from "react"

export const useLocalStorage = <T>(key: string) => {
    const [value, setValue] = useState<T | null>(null)

    const setItem = useCallback((item: T) => {
        if(isServerSide()) return

        localStorage.setItem(key, JSON.stringify(item))
        setValue(item)
    }, [key, setValue])
    
    const getItem = useCallback(() => {
        if(isServerSide()) return null

        const str = localStorage.getItem(key)
        if(str == null) return null

        try {
            const v: T = JSON.parse(str)
            return v
        } catch {
            return null
        }
    }, [key])

    const removeItem = useCallback(() => {
        if(isServerSide()) return

        localStorage.removeItem(key)
        setValue(null)
    }, [key, setValue])

    return { value, setItem, getItem, removeItem }
}
