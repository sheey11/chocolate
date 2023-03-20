import { useRouter } from "next/router"
import { MouseEventHandler } from "react"
import style from './Button.module.css'

type Props = {
    children: string | JSX.Element | JSX.Element[],
    type?: "primary" | "secondary" | "destructive" | "link",
    onClick?: MouseEventHandler,
    size?: "small" | "middle" | "large",
    disabled?: boolean,
    fullWidth?: boolean,
    href?: string,
    submit?: boolean,
    className?: string,
    ring?: "blue" | "red",
}

export default function Button({ type = "primary", children, onClick, size, disabled, fullWidth, href, submit, className, ring}: Props) {
    const router = useRouter()

    let colorClass = ""
    let shadow = true
    if (type == "primary" || type == undefined) {
        colorClass = "border border-indigo-600 bg-indigo-600 text-white"
    } else if (type == "secondary") {
        colorClass = "border border-slate-300 bg-white text-neutral-700"
    } else if (type == "destructive") {
        colorClass = "border border-red-600 bg-red-600 text-white"
    } else if (type == "link") {
        colorClass = "text-indigo-500 hover:text-underline hover:text-indigo-700"
        shadow = false
    }

    let ringClass = "focus:ring-blue-200"
    if (type == "destructive" || ring == "red") {
        ringClass = "focus:ring-red-200"
    } else if (ring == "blue" || ring == undefined)  {
        ringClass = "focus:ring-blue-200"
    }

    let sizeClass = "px-4 text-sm font-medium"
    if (size == "small") {
        sizeClass = "px-2 text-xs font-medium"
    } else if (size == "large") {
        sizeClass = "px-4 font-medium"
    }

    let disabledClass = ""
    if (disabled) {
        disabledClass = style.disabled
    }

    let widthClass = ""
    if(fullWidth) {
        widthClass = "w-full"
    }

    function handleClick(e: any) {
        if(href) { router.push(href) }
        if(onClick){ onClick(e) }
    }

    return (
        <button
            type={ submit ? "submit" : "button" }
            className={`${colorClass} ${sizeClass} ${disabledClass} ${widthClass} ${shadow ? "shadow-sm hover:shadow" : "" } py-1 rounded transition duration-300 ease select-none drop-shadow-sm focus:ring ${ringClass} ${className}`}
            onClick={handleClick}
            disabled={disabled}
            aria-disabled={disabled}
        >
            { children }
        </button>
    )
}
