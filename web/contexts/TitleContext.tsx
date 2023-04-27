import { createContext } from "react";

interface TitleContext {
    title: string,
    setTitle: (title: string[]) => void,
    setRawTitle: (title: string) => void,
}

export const TitleContext = createContext<TitleContext>({
    title: '',
    setTitle: (_) => {},
    setRawTitle: (_) => {},
})

