import { classNames } from "@/utils/classnames"
import { useRouter } from "next/router"
import { MouseEventHandler } from "react"

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

export default function Button({ type = "primary", children, onClick, size, disabled, fullWidth, href, submit, className = "", ring}: Props) {
    const router = useRouter()

    let colorClass = ""
    let shadow = true
    if (type == "primary" || type == undefined) {
        colorClass = "border border-blue-600 bg-blue-600 text-white"
    } else if (type == "secondary") {
        colorClass = "border border-slate-300 bg-white text-neutral-700"
    } else if (type == "destructive") {
        colorClass = "border border-red-600 bg-red-600 text-white"
    } else if (type == "link") {
        colorClass = "text-blue-600 hover:text-underline hover:text-blue-500"
        shadow = false
    }

    let ringClass = "focus:ring-blue-200"
    if (type == "destructive" || ring == "red") {
        ringClass = "focus:ring-red-300"
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
        if (type == "primary" || type == undefined) {
            disabledClass = "hover:bg-blue-500 hover:border-blue-500 cursor-not-allowed"
        } else if (type == "secondary") {
            colorClass = "hover:bg-slate-200 hover:border-slate-200 cursor-not-allowed"
        } else if (type == "destructive") {
            colorClass = "hover:bg-red-500 hover:border-5ed-400 cursor-not-allowed"
        }
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
            className={classNames(
                colorClass,
                sizeClass,
                disabledClass,
                widthClass,
                shadow ? "shadow-sm hover:shadow" : "",
                "py-1 rounded transition duration-300 ease select-none drop-shadow-sm focus:outline-none focus:ring",
                ringClass,
                className,
            )}
            onClick={handleClick}
            disabled={disabled}
            aria-disabled={disabled}
        >
            { children }
        </button>
    )
}
