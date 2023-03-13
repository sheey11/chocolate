import { isServerSide } from "@/utils/server"
import { useState } from "react"

export const useLocalStorage = <T>(key: string) => {
    const [value, setValue] = useState<T | null>(null)

    const setItem = (item: T) => {
        if(isServerSide()) return

        localStorage.setItem(key, JSON.stringify(item))
        setValue(item)
    }
    
    const getItem = () => {
        if(isServerSide()) return null

        const str = localStorage.getItem(key)
        if(str == null) return null

        try {
            const v: T = JSON.parse(str)
            setValue(v)
            return v
        } catch {
            setValue(null)
            return null
        }
    }

    const removeItem = () => {
        if(isServerSide()) return

        localStorage.removeItem(key)
        setValue(null)
    }

    return { value, setItem, getItem, removeItem }
}
