import { AuthContext } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { localize } from "@/i18n/i18n";
import { Chat } from "@/utils/chat";
import { ArrowUpCircleIcon } from "@heroicons/react/24/outline";
import { time } from "console";
import { Chivo_Mono } from "next/font/google"
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useRef, useState } from "react"

const timeMonoFont = Chivo_Mono({
    weight: "400",
    subsets: ['latin']
})

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export interface ChatItem {
    id: number,
    username?: string,
    userid?: number,
    isHighlighted?: boolean,
    content?: string,
    time?: Date,
    adminMessageContent?: string
}

function ChatItem({ username, isHighlighted, content, adminMessageContent, time }: ChatItem) {
    if (adminMessageContent) {
        return (
            <div className="block my-1 text-gray-600">
                { adminMessageContent }
            </div>
        )
    } else {
        return (
            <div className="block my-1">
                <time className={classNames(
                    timeMonoFont.className,
                    "mr-1"
                )} dateTime={time?.toString()}>
                    { time === undefined ? "" : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, }) }
                </time>
                <button aria-label="username" className={classNames(
                    "font-medium",
                    isHighlighted ? "text-blue-500 font-bold" : "text-black-800 font-medium",
                    "rounded hover:bg-gray-100",
                )}>
                    { username } 
                </button>
                <span aria-label="content" className={classNames(
                    "before:content-[':'] before:pr-0.5 before:text-black",
                    isHighlighted ? "text-blue-500 font-bold" : "text-black"
                )}>
                    { content }
                </span>
            </div>
        )
    }
}

interface ChatViewerProps {
    chats: ChatItem[]
}

function ChatViwer({ chats }: ChatViewerProps) {
    return (
        <div className="overflow-y-scroll h-full pl-4">
            { chats.map((chatProps) => (
                <ChatItem {...chatProps} key={chatProps.id}/>
            ))}
        </div>
    )
}

interface ChatBoxProps {
    websocketUrl: string | undefined
    onCutoff: () => void,
    onStartStreaming: () => void,
}
export default function ChatBox({ websocketUrl, onCutoff, onStartStreaming }: ChatBoxProps) {
    const router = useRouter()
    const lang = router.locale!

    const [chats, setChats] = useState<ChatItem[]>([])
    const [chatBanned, setChatBanned] = useState<boolean>(false)
    const chatId = useRef(0)

    const { getItem: getToken } = useLocalStorage<string>('access-token')
    const { authenticated } = useContext(AuthContext)

    const chatInputRef = useRef<HTMLTextAreaElement | null>(null)
    const chatWebsocket = useRef<WebSocket | null>(null)

    const increaseChatId = () => chatId.current = chatId.current + 1
    const sendToViewer = (item: ChatItem) => setChats(c => [...c, item])

    const onSocketConnected = useCallback((socket: WebSocket, event: Event) => {
        socket.send(JSON.stringify({
            authenticated: getToken() != null,
            token: getToken(),
        }))
        sendToViewer({
            id: chatId.current,
            adminMessageContent: "Welcome to chat",
        })
        increaseChatId()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getToken])

    const onSocketMessageRecv = useCallback((socket: WebSocket, event: MessageEvent<any>) => {
        const message: Chat = JSON.parse(event.data)
        if(message.admin_msg_id == 35) {
            setChatBanned(true)
            return
        } else if(message.type === 'ping') {
            socket.send(JSON.stringify({
                type: "pong",
            }))
            return
        } else if(message.type === 'cut_off') {
            onCutoff()
            return
        } else if(message.type === 'start_streaming') {
            setTimeout(onStartStreaming, 1000)
            return
        } else if (message.type !== 'chat') {
            return
        }
        sendToViewer({
            id: chatId.current,
            username: message.sender,
            userid: message.sender_id,
            isHighlighted: message.sender_role != 'user',
            content: message.content,
            time: new Date(message.time),
        })
        increaseChatId()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId])

    const onSocketError = useCallback((socket: WebSocket, event: Event) => {
        sendToViewer({
            id: chatId.current,
            content: "error connecting to server",
        })
        increaseChatId()
        console.log("websocker error", event)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId])

    const reloadChat = useCallback(() => {
        if (chatBanned) { return }
        let socket = chatWebsocket.current
        if (socket != null) {
            socket.close()
            return
        }
        chatWebsocket.current = new WebSocket(websocketUrl!) 
        socket = chatWebsocket.current

        socket.addEventListener('open', (e) => onSocketConnected(socket!, e))
        socket.addEventListener('message', (e) => onSocketMessageRecv(socket!, e))
        socket.addEventListener('error', (e) => onSocketError(socket!, e))
        socket.addEventListener('close', () => {
            chatWebsocket.current = null
        })

    }, [websocketUrl, chatBanned, onSocketConnected, onSocketMessageRecv, onSocketError])

    useEffect(() => {
        if (typeof window === 'undefined' || websocketUrl === undefined) { return }
        reloadChat()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [websocketUrl])

    const sendChatMessage = () => {
        chatInputRef.current?.focus()
        if (!chatInputRef.current || chatInputRef.current.value == "") { return }
        chatWebsocket.current?.send(JSON.stringify({
            type: "chat",
            content: chatInputRef.current.value,
        }))
        chatInputRef.current.value = ""
    }

    return (
        <>
            <h2 aria-label="chat" className="hidden lg:block px-4 py-5 sm:px-6 text-lg font-medium">
                { localize(lang, "chat") }
            </h2>
            <div className="lg:border-t lg:border-gray-200 text-sm h-96">
                <ChatViwer chats={chats}/>
            </div>
            <div className="border-t border-gray-200 relative rounded-b-lg">
                { !authenticated ?
                    (<>
                        <div className="py-8 text-sm text-gray-600 flex items-center justify-center">
                            <Link href="/signin" className="text-blue-500">
                                {localize(lang, "signin")}
                            </Link>
                            { localize(lang, "to_chat") }
                        </div>
                    </>)
                    :
                    (<>
                        <textarea
                            ref={chatInputRef}
                            rows={3}
                            className={ classNames(
                                "border-none lg:rounded-b-lg mx-[1px] w-[calc(100%-2px)] lg:px-2 lg:w-full h-full text-sm block z-10", 
                                "transition duraion-200",
                                "focus:outline-none lg:focus:ring lg:focus:ring-blue-500",
                                "resize-none",
                            )}
                            placeholder={localize(lang, "send_to_chat")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    sendChatMessage()
                                }
                            }}
                        />
                        <button
                            className={classNames(
                                "w-8 h-8 p-2 bg-blue-500 text-white rounded-full block",
                                "absolute bottom-1 right-1",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                                "hover:bg-blue-600 transition duration-200",
                            )}
                            onClick={() => sendChatMessage()}>
                            <ArrowUpCircleIcon />
                        </button>
                    </>)}
            </div>
        </>
    )         
}
