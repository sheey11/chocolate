import { fetchVersion } from "@/api/v1/stat"
import { useEffect, useState } from "react"

export default function SRSVersion() {
    const [version, setVersion] = useState('')

    useEffect(() => {
        if(version !== '') return
        fetchVersion().then((response) => {
            setVersion(`${response.version.major}.${response.version.minor}.${response.version.revision}`)
        }).catch((err) => {
            console.error('fetch srs version info failed', err)
            setVersion('')
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setVersion])

    if(version === '') {
        return <></>
    }

    return (
        <>
            <span aria-label="srs version" className="w-fit px-2 bg-gray-600 rounded text-white text-xs">
                SRS { version }
            </span>
        </>
    )
}
