import {
    ArrowPathRoundedSquareIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    PauseIcon,
    PlayIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon
} from "@heroicons/react/24/solid";
import { CodeBracketSquareIcon, StopIcon } from "@heroicons/react/24/outline"
import { useRef, useState, useCallback, useEffect } from "react";
import { Player } from "@/utils/mpegts";
import { useRouter } from "next/router";
import { localize } from "@/i18n/i18n";
import "humanizer.node"

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

function humanizeSpeed(v: any) {
  v = Math.abs(v)
  let bs = (v).kilobytes()

  if(bs.bytes < 768) {
    return `${bs.bytes.toFixed(0)} B/s`
  } else if (bs.kilobytes < 768) {
    return `${bs.kilobytes.toFixed(1)} KB/s`
  } else if (bs.megabytes < 768) {
    return `${bs.megabytes.toFixed(1)} MB/s`
  } else if (bs.gigabytes < 678) {
    return `${bs.gigabytes.toFixed(1)} GB/s`
  } else if (bs.terabytes < 789) {
    return `${bs.terabytes.toFixed(1)} TB/s`
  }
  return "0 B/s"
}

interface StreamBoxProps {
    theaterMode: boolean
    playbackUrl: string | undefined
    setTheaterMode: (arg0: boolean) => void
    streamingStatus: string
}

export default function StreamVideoBox({ theaterMode, playbackUrl, setTheaterMode, streamingStatus }: StreamBoxProps){
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const videoWrapperRef = useRef<HTMLDivElement | null>(null)
    const [volume, _setVolume] = useState(100)
    const [previousVolume, setPreviousVolume] = useState(100)
    const [paused, setPaused] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)

    const [buffering, setBuffering] = useState(false)
    const [bufferingSpeed, setBufferingSpeed] = useState(0)

    const [staticsticsTimer, setStatisticsTimer] = useState<NodeJS.Timer | null>(null)

    const router = useRouter()
    const lang = router.locale!

    const unloadVideo = () => {
        if(player.current != null)  {
            player.current?.pause()
            player.current?.unload()
            player.current?.detachMediaElement()
            player.current?.destroy()
        }
    }

    useEffect(() => unloadVideo, [])

    const reloadVideo = useCallback(() => {
        import("mpegts.js" ).then((Mpegts: any) => {
            if (Mpegts.getFeatureList().mseLivePlayback) {
                unloadVideo()

                if (videoRef.current == null) { return }
                player.current = Mpegts.createPlayer({
                    type: "flv",
                    isLive: true,
                    url: playbackUrl,
                })

                player.current?.attachMediaElement(videoRef.current!)
                player.current?.load()
                player.current?.play()

                setStatisticsTimer(t => {
                    if(t != null) clearInterval(t)
                    return setInterval(recordCurrentTime, 3000)
                })
            }
        })
    }, [playbackUrl])

    const recordCurrentTime = () => {
        if (player.current == null) return
        setBufferingSpeed(player.current.statisticsInfo.speed)
    }

    useEffect(() => {
        if (typeof window === 'undefined' || playbackUrl === undefined) { return }
        reloadVideo()
    }, [playbackUrl, reloadVideo])

    const handleSwitchPause = () => {
        if (player.current != null) {
            if (paused) {
                player.current?.play()
            } else {
                player.current?.pause()
            }
            setPaused(!paused)
        }
    }

    const toggleFullscreen = () => {
        if (document.fullscreenElement === videoWrapperRef.current) {
            document.exitFullscreen()
        } else {
            videoWrapperRef.current?.requestFullscreen()
        }
        setFullscreen(!fullscreen)
    }

    const toggleTheaterMode = () => {
        setTheaterMode(!theaterMode)
        if (fullscreen) {
            toggleFullscreen()
        }
    }

    const setVolume = (value: number) => {
        if (videoRef.current != null) {
            videoRef.current.volume = (value / 100)
            _setVolume(value)
        }
    }

    const toggleMute = () => {
        if (videoRef.current != null) {
            if(volume == 0) {
                setVolume(previousVolume)
            } else {
                setPreviousVolume(videoRef.current.volume * 100)
                setVolume(0)
            }
        }
    }

    let player = useRef<Player | null>(null)
    return (
        <div ref={videoWrapperRef} className="video-wrapper w-full relative hover-display">
            <div className={ classNames("relative", fullscreen ? "h-full" : (theaterMode ? "pb-[75vh]" : "pb-[56.25%]")) }>
                { /* the padding-bottom trick comes from https://stackoverflow.com/questions/30789414/css-set-height-according-to-width */ }
                <video ref={videoRef} autoPlay className="w-full h-full bg-black absolute top-0 bottom-0 left-0 right-0">
                    Your browser is too old to support HTML5 video.
                </video>
                { streamingStatus === 'idle' ?
                    <div className="w-full h-full bg-black absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-lg text-white select-none">
                        主播不在哦
                    </div>
                    :
                    <></>
                }
                { buffering ?
                    <div className="w-full h-full flex item-center justify-center">
                        <svg className="animate-spin inline-block mx-2 -mt-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{ localize(lang, "buffering") }</span>
                        <span>{ humanizeSpeed(bufferingSpeed) }</span>
                    </div>
                    :
                    <></>
                }
            </div>
            <div className="bg-gradient-to-t from-black/50 from-50% to-white/0 h-12 absolute z-10 bottom-0 w-full opacity-0 transition duration-200 controls flex items-end">
                <div className="h-8 px-2 w-full flex flex-row items-center justify-between text-white">
                    <div className="flex flex-row space-x-2 items-center">
                        <button onClick={handleSwitchPause} className="h-6 w-6 hover:text-gray-200 transition duration-400" aria-label="switch play pause">
                            { paused ? 
                                <PlayIcon />
                                :
                                <PauseIcon />
                            }
                        </button>
                        <button onClick={() => { reloadVideo(); setPaused(false) }} className="h-6 w-6 hover:text-gray-200 transition duration-400">
                            <ArrowPathRoundedSquareIcon />
                        </button>
                        <span className="volume-wrapper flex items-center space-x-2">
                            <label htmlFor="volume">
                                <button aria-label="mute" onClick={() => toggleMute()} className="h-6 w-6 hover:text-gray-200 transition duration-400 block p-0.5">
                                    { volume != 0 ? 
                                        <SpeakerWaveIcon />
                                        :
                                        <SpeakerXMarkIcon />
                                    }
                                </button>
                            </label>
                            <input
                                value={volume}
                                onChange={(e) => { setVolume(e.target.valueAsNumber) }}
                                id="volume"
                                name="volume"
                                min="0"
                                max="100"
                                type="range"
                                className="inline-block w-16 lg:w-20"/>
                        </span>
                        <span className="text-xs pl-2">
                            { humanizeSpeed(bufferingSpeed) }
                        </span>
                    </div>
                    <div className="h-full flex items-center space-x-4">
                        <button className="h-6 w-6 hover:text-gray-200 transition duration-400" onClick={toggleTheaterMode} aria-label="theater mode">
                            { theaterMode ?
                                <StopIcon />
                                :
                                <CodeBracketSquareIcon />
                            }
                        </button>
                        <button className="h-6 w-6 hover:text-gray-200 transition duration-400" onClick={toggleFullscreen} aria-label={ localize(lang, 'fullscreen') }>
                            { fullscreen ?
                                <ArrowsPointingInIcon />
                                :
                                <ArrowsPointingOutIcon />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
