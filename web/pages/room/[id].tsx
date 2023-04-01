import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { AuthContext } from "@/contexts/AuthContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/router";
import Button from "@/components/Button/Button";
import { localize } from "@/i18n/i18n";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";

const userNavs = [
  {
    i18n_key: "rooms_page",
    href: "/room",
  },
]

export default function Room() {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const lang = router.locale!

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoWrapperRef = useRef<HTMLDivElement | null>(null)

  const [volume, _setVolume] = useState(100)

  let player = useRef<any | null>(null)

  const { id } = router.query
  // http://localhost/api/v1/playback/1/flv
  // TODO: Debug
  // on production: remove "http://localhost" part
  const playbackUrl = `http://localhost/api/v1/playback/${id}/flv`

  const reloadVideo = useCallback(() => {
    import("mpegts.js" ).then((Mpegts: any) => {
      if (Mpegts.getFeatureList().mseLivePlayback) {
        if(player.current != null)  {
          player.current?.pause()
          player.current?.unload()
          player.current?.detachMediaElement()
          player.current?.destroy()
        }
        
        player.current = Mpegts.createPlayer({
          type: "flv",
          isLive: true,
          url: playbackUrl,
        })

        player.current?.attachMediaElement(videoRef.current)
        player.current?.load()
        player.current?.play()
      }
    })
  }, [playbackUrl])

  useEffect(() => {
    if (typeof window === 'undefined' || id === undefined) { return }
    reloadVideo()
  }, [id, playbackUrl, reloadVideo])

  const handlePlay = () => {
    player.current?.play()
  }

  const handlePause = () => {
    player.current?.pause()
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement === videoWrapperRef.current) {
      document.exitFullscreen()
    } else {
      videoWrapperRef.current?.requestFullscreen()
    }
  }

  const setVolume = (value: number) => {
    if (videoRef.current != null) {
      videoRef.current.volume = (value / 100)
      _setVolume(value)
    }
  }

  return (
    <>
      <Nav navs={userNavs} user={{name: user?.username!, role: user?.role!}}/>
      <main className="pt-10 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div ref={videoWrapperRef} className="video-wrapper w-full relative hover-display">
          <video ref={videoRef} autoPlay className="w-full">
            Your browser is too old to support HTML5 video.
          </video>
          <div className="bg-black/30 px-2 absolute z-10 bottom-0 w-full h-10 opacity-0 transition duration-200 controls">
            <div className="h-full w-full flex flex-row items-center justify-between">
              <div className="flex flex-row space-x-2 items-center">
                <Button onClick={handlePlay}>
                  { localize(lang, "play") }
                </Button>
                <Button onClick={handlePause}>
                  { localize(lang, "pause") }
                </Button>
                <Button onClick={reloadVideo}>
                  { localize(lang, "reload") }
                </Button>
                <span className="volume-wrapper text-white flex items-center space-x-4">
                  <label htmlFor="volume">
                    <button aria-label="mute" onClick={() => setVolume(0)}>
                      { volume != 0 ? 
                        <SpeakerWaveIcon className="h-4 w-4 inline-block"/>
                        :
                        <SpeakerXMarkIcon className="h-4 w-4 inline-block"/>
                      }
                    </button>
                  </label>
                  <input value={volume} onChange={(e) => { setVolume(e.target.valueAsNumber) }} id="volume" name="volume" min="0" max="100" type="range" className="inline-block"/>
                </span>
              </div>
              <div>
                <Button type="secondary"onClick={toggleFullscreen}>
                  { localize(lang, "fullscreen") }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
