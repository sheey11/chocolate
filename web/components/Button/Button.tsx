import { MouseEventHandler } from "react"
import style from './Button.module.css'

type Props = {
    children: string | JSX.Element | JSX.Element[],
    type?: "primary" | "secondary" | "destructive",
    onClick?: MouseEventHandler,
    size?: "small" | "middle" | "large",
    disabled?: boolean,
    fullWidth?: boolean,
    href?: string,
    submit?: boolean,
}

export default function Button({ type, children, onClick, size, disabled, fullWidth, href, submit }: Props) {
    let colorClass = ""
    if (type == "primary" || type == undefined) {
        colorClass = "border-indigo-600 bg-indigo-600 text-white"
    } else if (type == "secondary") {
        colorClass = "border-slate-300 bg-white text-neutral-700"
    } else if (type == "destructive") {
        colorClass = "border-red-600 bg-red-600 text-white"
    }

    let sizeClass = "px-2 text-sm font-medium"
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
        if(href) { window.open(href, '_blank'); }
        if(onClick){ onClick(e) }
    }

    return (
        <button
            type={ submit ? "submit" : "button" }
            className={`${colorClass} ${sizeClass} ${disabledClass} ${widthClass} py-1 border shadow-sm rounded transition duration-300 ease select-none drop-shadow-sm focus:ring focus:ring-blue-300 hover:shadow`}
            onClick={handleClick}
            disabled={disabled}
            aria-disabled={disabled}
        >
            { children }
        </button>
    )
}
