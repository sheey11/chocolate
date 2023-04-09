import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { AuthContext } from "@/contexts/AuthContext";
import { useContext, useEffect, useState } from "react"
import { useRouter } from "next/router";
import { localize, localizeError } from "@/i18n/i18n";
import StreamVideoBox from "@/components/StreamVideoBox/StreamVideoBox";
import ChatBox from "@/components/ChatBox/ChatBox";
import RoomInfo from "@/components/RoomInfo/RoomInfo";

import { JetBrains_Mono } from "next/font/google";

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
})

const userNavs = [
  {
    i18n_key: "rooms_page",
    href: "/room",
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Room() {
  const { authenticated, getUser } = useContext(AuthContext)
  const router = useRouter()
  const lang = router.locale!

  const id = router.query.id as string | undefined

  const [theatherMode, setThreaterMode] = useState(false)

  const [playbackUrl, setPlaybackUrl] = useState<string | undefined>(undefined)
  const [websocketUrl, setWebsocketUrl] = useState<string | undefined>(undefined)

  const [errCode, setErrCode] = useState<number | null>(null)
  const [httpErrCode, setHttpErrCode] = useState<number | null>(null)

  const [streamingStatus, setStreamingStatus] = useState<string>("idle")

  useEffect(() => {
    if (id === undefined) { return }

    if (!/^[1-9]\d*$/.test(id)) {
      setHttpErrCode(400)
      setErrCode(19)
      return
    }

    setWebsocketUrl(`${window.location.protocol == "http:" ? "ws:" : "wss:"}//${window.location.host}/api/v1/rooms/${id}/chat`)
    if (streamingStatus != 'streaming') { return }
    setPlaybackUrl(`/api/v1/playback/${id}/flv`)
  }, [id, streamingStatus])

  if(errCode != null) {
    return (
      <>
        <Nav navs={userNavs}/>
        <main className="mx-auto max-w-7xl lg:pt-8 h-[calc(100vh-13rem)] md:h-[calc(100vh-14.5rem)] flex flex-col items-center justify-center">
          <h1 className={ classNames("text-7xl", jbm.className) }>{ httpErrCode }</h1>
          <span className="text-sm text-gray-600 font-bold">
            { localizeError(lang, errCode) }
          </span>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <div className="min-h-[100vh] flex flex-col justify-between">
      <div>
        <Nav navs={userNavs}/>
        <main className={ classNames(
          "pb-10 mx-auto",
          theatherMode ? "" : "max-w-7xl lg:pt-8"
        )}>
          <StreamVideoBox theaterMode={theatherMode} setTheaterMode={setThreaterMode} playbackUrl={playbackUrl} streamingStatus={streamingStatus}/>
          <div className={classNames(
            "m-auto w-full",
            "lg:mt-5",
            "flex flex-col-reverse space-y-reverse space-y-4",
            "lg:space-y-0 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4",
            theatherMode ?  "max-w-7xl pt-8" : ""
          )}>

            <section className="col-span-3 lg:rounded-lg shadow bg-white" aria-label="room information">
              <RoomInfo
                id={id}
                onError={(errCode, httpCode) => { setErrCode(errCode); setHttpErrCode(httpCode); }}
                setStatus={setStreamingStatus}
              />
            </section>

            <section className="col-span-1 lg:rounded-lg shadow bg-white" aria-labelledby="chat-section-title">
              <ChatBox websocketUrl={websocketUrl}/>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
