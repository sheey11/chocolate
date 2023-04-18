import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react"
import Message, { MessageType } from "./Message"

export interface MessageQueueHandle {
    success: (content: string, title: string, autoClose?: boolean) => void
    error: (content: string, title: string, autoClose?: boolean) => void
}

const MessageQueue = forwardRef<MessageQueueHandle>(function MessageQueue(props, ref) {
    const [ messageQueue, setMessageQueue ] = useState<{ [key: number]: MessageType }>({})
    const [ messageShow,  setMessageShow  ] = useState<{ [key: number]: boolean }>({})
    const id = useRef<number>(0)

    useImperativeHandle(ref, () => {
        return {
            success(content: string, title: string, autoClose?: boolean) {
                const message: MessageType = { key: id.current++, title, content, type: "success", autoClose }
                setMessageQueue(q => {
                    q[message.key] = message
                    return Object.assign({}, q)
                })
                setMessageShow((s: any) => {
                    s[message.key] = true
                    return Object.assign({}, s)
                })
            },
            error(content: string, title: string, autoClose?: boolean) {
                const message: MessageType = { key: id.current++, title, content, type: "error", autoClose }
                setMessageQueue(q => {
                    q[message.key] = message
                    return Object.assign({}, q)
                })
                setTimeout(() => {
                    setMessageShow((s: any) => {
                        s[message.key] = true
                        return Object.assign({}, s)
                    })
                }, 10)
            }
        }
    })

    const handleMessageDelete = (key: number) => {
        if(!messageShow[key]) return
        setMessageShow((s: any) => {
            delete s[key]
            return Object.assign({}, s)
        })
        setTimeout(() =>{
            setMessageQueue((s) => {
                delete s[key]
                return Object.assign({}, s)
            })
        }, 200)
    }

    return (
        <div className="fixed right-4 top-8 w-96 max-w-[calc(100%-2rem)] space-y-4 point-events-none">
            { Object.keys(messageQueue).reverse().map((k: string) => {
                const m = messageQueue[k as unknown as number]
                return (
                    <Message key={m.key} message={m} show={messageShow[m.key]} onClose={handleMessageDelete} />
                )
            })}
        </div>
    )
})

export default MessageQueue
