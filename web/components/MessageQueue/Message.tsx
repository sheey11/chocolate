import { classNames } from "@/utils/classnames"
import { Transition } from "@headlessui/react"
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Fragment, useEffect, useRef } from "react"

export interface MessageType {
    key: number
    title: string
    content: string
    type: "error" | "success"
    autoClose?: boolean
}

interface MessageProps {
    message: MessageType
    show?: boolean
    onClose: (id: number) => void
}

export default function Message({ message, show, onClose }: MessageProps) {
    const timer = useRef<NodeJS.Timer | null>(null)

    useEffect(() => {
        if(!message.autoClose) return
        timer.current = setTimeout(() => {
            onClose(message.key)
        }, 3 * 1000)
        
        return () => {
            if(timer.current != null)
            clearTimeout(timer.current)
        }
    }, [message.autoClose, message.key, onClose])

    return (
        <div key={message.key}>
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
                <Transition
                    show={show === true}
                    as={Fragment}
                    enter="transform ease-out duration-300 transition-all"
                    enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                    enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                    leave="transition-all ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className={classNames(
                        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg",
                        message.type === 'error' ? "ring-2 ring-red-500" : "ring-1 ring-black ring-opacity-5",
                    )}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    { message.type === 'success' ?
                                        <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                                        :
                                        <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                                    }
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900">{ message.title }</p>
                                    <p className="mt-1 text-sm text-gray-500">{ message.content }</p>
                                </div>
                                <div className="ml-4 flex flex-shrink-0">
                                    <button
                                        type="button"
                                        className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                                        onClick={() => onClose(message.key)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    )
}
