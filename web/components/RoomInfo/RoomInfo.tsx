import { RoomInfoResponse } from "@/api/v1/datatypes";
import { fetchRoomInfo } from "@/api/v1/room"
import { UsersIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react"

interface RoomInfoProps {
    id?: string
    onError?: (code: number) => void,
}
export default function RoomInfo({ id, onError }: RoomInfoProps) {
    const [roomInfo, setRoomInfo] = useState<RoomInfoResponse | undefined>(undefined);

    useEffect(() => {
        if(id === undefined) return
        if(isNaN(parseInt(id))) return

        fetchRoomInfo(parseInt(id)).then((response) => {
            setRoomInfo(response)
        }).catch((e) => {
            if(onError != null)
                onError(e.response?.data.code)
        })
    }, [id, onError])
    return (
        <>
            <div aria-label="room title" className="px-4 py-5 sm:px-6 flex flex-row items-center justify-between">
                <div className="flex items-center">
                    <h2 className="text-lg font-medium">
                        { roomInfo?.title }
                    </h2>
                    { roomInfo?.status === "streaming" ?
                        <span className="inline-block ml-2 relative h-2 w-2 rounded-full bg-green-500">
                            <span className="inline-block absolute animate-ping h-2 w-2 rounded-full bg-green-500"/>
                        </span>
                        :
                        <span className="h-1 w-1 ml-2 bg-gray-400"/>
                    }
                </div>
                <div className="flex flex-row items-center space-x-1">
                    <UsersIcon className="h-4 w-4 text-stone-600"/>
                    <span className="text-xs"> { roomInfo?.viewers } </span>
                </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                TODO
            </div>
        </>
    )
}
