export interface Chat {
    type: string
    content: string
    sender: string
    sender_id: uint
    sender_role: string
    admin_msg_id: number
    time: Date
}
