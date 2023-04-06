import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { ArrowDownIcon, ArrowUpIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/24/solid"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { localize, localizeError } from "@/i18n/i18n"

import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js"
import { Chart } from "react-chartjs-2"
import { Footer } from "@/components/Footer/Footer"
import Button from "@/components/Button/Button"
import SRSVersion from "@/components/SRSVersion/SRSVersion"

import { getNetworkChartOptions, getPerfChartOptions, getDiskChartOptions, corsair, getMiniChartOptions, getMemChartOptions, humanizeSpeed} from "@/constants/charts-config"
import { dashboardNavs } from "@/constants/navs"
import { classNames } from "@/utils/classnames"
import { fetchChatStat, fetchClientInformation, fetchHostInformation, fetchStreamInformation, fetchUserNum, HostInformation } from "@/api/v1/stat"
import { JetBrains_Mono } from "next/font/google"

import * as predefinedData from "@/utils/charts-predefind-data"
import { ChatStats, ClientInformation, RoomAdminInfo, StreamInformation } from "@/api/v1/datatypes"
import { fetchRooms } from "@/api/v1/admin/room"

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
})

export default function AdminPage () {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const lang = router.locale!

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const [ streamingData,    setStreamingData    ] = useState(predefinedData.getStreamingData   ([], []    ))
  const [ viewersData,      setViewersData      ] = useState(predefinedData.getViewersData     ([], []    ))
  const [ usersData,        setUsersData        ] = useState(predefinedData.getUsersData       ([], []    ))
  const [ chatsData,        setChatsData        ] = useState(predefinedData.getChatsData       ([], []    ))
  const [ networkData,      setNetworkData      ] = useState(predefinedData.getNetworkChartData([], [], []))
  const [ cpuData,          setCpuData          ] = useState(predefinedData.getCpuChartData    ([], []    ))
  const [ memData,          setMemData          ] = useState(predefinedData.getMemChartData    ([], []    ))
  const [ diskData,         setDiskData         ] = useState(predefinedData.getDiskChartData   ([], [], []))

  const [hostInformation,   setHostInformation  ] = useState<HostInformation | null>(null)
  const [streamInformation, setStreamInformation] = useState<StreamInformation | null>(null)
  const [clientInformation, setClientInformation] = useState<ClientInformation | null>(null)
  const [userNum,           setUserNum          ] = useState<number>(0)
  const [chatStat,          setChatStat         ] = useState<ChatStats | null>(null)

  const [rooms,             setRooms            ] = useState<RoomAdminInfo[]>([])

  const dealWithFetchError = (e: any) => {
        console.error(e)
        setHostInformation(null)
        setErrCode(e.response?.data!.code)
        setHttpErrCode(e.response?.status)
  }

  const refreshStats = useCallback(async () => {
    fetchHostInformation()
      .then(info => {
        setHostInformation(info)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })

    fetchStreamInformation()
      .then(info => {
        setStreamInformation(info)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })

    fetchClientInformation()
      .then(info => {
        setClientInformation(info)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })

    fetchUserNum()
      .then(num => {
        setUserNum(num)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })
 
    fetchChatStat()
      .then(stat => {
        setChatStat(stat)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })

    fetchRooms({ status: 1 })
      .then(response => {
        setRooms(response.rooms)
      })
      .catch((e) => {
        dealWithFetchError(e)
      })
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  useEffect(() => {
    if(!hostInformation) return
    const delta_time = hostInformation.time.slice(1, -1)
    setNetworkData(predefinedData.getNetworkChartData(delta_time          , hostInformation.network_outbound, hostInformation.network_inbound))
    setCpuData    (predefinedData.getCpuChartData    (hostInformation.time, hostInformation.cpu                                              ))
    setMemData    (predefinedData.getMemChartData    (hostInformation.time, hostInformation.mem                                              ))
    setDiskData   (predefinedData.getDiskChartData   (hostInformation.time, hostInformation.disk_read       , hostInformation.disk_write     ))
  }, [hostInformation])

  useEffect(() => {
  if(!streamInformation) return
    setStreamingData(predefinedData.getStreamingData(streamInformation.time, streamInformation.samples.map((v) => v.streams.length)))
  }, [streamInformation])

  useEffect(() => {
    if(!clientInformation) return
    setViewersData(predefinedData.getViewersData(clientInformation.time, clientInformation.samples.map((v) => v.clients.length)))
  }, [clientInformation])

  useEffect(() => {
    setUsersData(predefinedData.getUsersData(['', ''], [userNum, userNum]))
  }, [userNum])

  useEffect(() => {
    if(!chatStat) return
    setChatsData(predefinedData.getChatsData(chatStat.times, chatStat.nums))
  }, [chatStat])

  const humanizeTimeDiff = (millisec: number) => {
    const sec = Math.floor(millisec / 1000)
    if(sec < 60) {
      return `${sec} ${localize(lang, "second")}`
    } else if (sec < 3600) {
      return `${Math.floor(sec / 60)} ${localize(lang, "minute")} ${sec % 60} ${localize(lang, "second")}`
    } else {
      return `${Math.floor(sec / 3600)} ${localize(lang, "hour")} ${Math.floor(sec / 60) % 60} ${localize(lang, "minute")} ${sec % 60} ${localize(lang, "second")}`
    }
  }

  // --------------

  if(!authenticated || getUser()?.role != "administrator") {
    return (
      <>
        <Nav navs={dashboardNavs} />
        <main className="mx-auto max-w-7xl lg:pt-8 h-[calc(100vh-13rem)] md:h-[calc(100vh-14.5rem)] flex flex-col items-center justify-center">
          <h1 className={ classNames("text-7xl", jbm.className) }>403</h1>
          <span className="text-sm text-gray-600 font-bold">
            { localizeError(lang, 13) }
          </span>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav navs={dashboardNavs} />
      <main className="pt-5 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex flex-row py-5 space-x-2 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-gray-800 text-3xl font-bold">
              { localize(lang, "overview") }
            </h1>
            <button
              className="ml-1 p-1 rounded-full focus:outline-none focus:ring focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              onClick={() => refreshStats()}
            >
              <ArrowPathRoundedSquareIcon className="h-4 w-4 text-gray-400"/>
            </button>
          </div>
          <SRSVersion/>
        </div>
        <div className="grid lg:grid-cols-4 lg:grid-rows-1 md:grid-cols-2 md:grid-rows-2 sm:grid-cols-1 sm:grid-rows-4 gap-y-4 lg:gap-y-0 md:gap-x-4">
          <div className="bg-white rounded-lg shadow h-40 w-full text-blue-600 flex flex-col overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                { streamInformation?.num_streams.toLocaleString() }
              </h2>
              <span>
                { localize(lang, "streaming") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={80} options={getMiniChartOptions(100)} data={streamingData}/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow h-40 w-full text-red-600 flex flex-col overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                { clientInformation?.num_clients.toLocaleString() }
              </h2>
              <span>
                { localize(lang, "viewers") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={60} width="100%" options={getMiniChartOptions(200)} data={viewersData}/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow h-40 w-full text-green-600 flex flex-col overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                { userNum }
              </h2>
              <span>
                { localize(lang, "users") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={60} options={getMiniChartOptions(300)} data={usersData}/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow h-40 w-full text-amber-500 flex flex-col overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                { chatStat?.nums.at(-1) }
              </h2>
              <span>
                { localize(lang, "chats") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={60} options={getMiniChartOptions(400)} data={chatsData}/>
              </div>
            </div>
          </div>
        </div>

        <div id="traffic" className="p-5 my-5 bg-white shadow rounded-lg">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-bold">{ localize(lang, "traffic") }</h2>
          </div>
          <div className="flex flex-row justify-between my-6">

            <div className="flex flex-col items-start">
              <span className={`font-bold text-lg`}>
                {
                  hostInformation && hostInformation.num_conn.length > 0 ?
                    hostInformation.num_conn[hostInformation.num_conn.length - 1].toLocaleString()
                    :
                    localize(lang, 'unknown')
                }
              </span>
              <span className={`text-gray-500 text-sm`}>
                { localize(lang, "connections") }
              </span>
            </div>

            <div className="flex flex-row space-x-4 mr-2">
              <div className="flex flex-row space-x-1">
                <span className="inline-block h-5 w-5 mt-1 text-purple-500">
                  <ArrowUpIcon />
                </span>
                <span className="flex flex-col items-start">
                  <span className={`font-bold text-lg`}>
                    {
                      hostInformation && hostInformation.network_outbound.length > 0 ?
                        humanizeSpeed(hostInformation.network_outbound.at(-1))
                        :
                        localize(lang, "unknown")
                    }
                  </span>
                  <span className={`text-gray-500 text-sm`}>
                    { localize(lang, "outbound") }
                  </span>
                </span>
              </div>

              <div className="flex flex-row space-x-1">
                <span className="inline-block h-5 w-5 mt-1 text-green-500">
                  <ArrowDownIcon />
                </span>
                <span className="flex flex-col items-start">
                  <span className={`font-bold text-lg`}>
                    {
                      hostInformation && hostInformation.network_inbound.length > 0 ?
                        humanizeSpeed(hostInformation.network_inbound.at(-1))
                        :
                        localize(lang, "unknown")
                    }
                  </span>
                  <span className={`text-gray-500 text-sm`}>
                    { localize(lang, "inbound") }
                  </span>
                </span>
              </div>
            </div>

          </div>
          <div className="w-full mt-6">
            <Chart height={200} options={getNetworkChartOptions(lang, 500)} plugins={[corsair]} type="line" data={networkData}/>
          </div>
        </div>

        <div id="perf-section" className="shadow rounded-lg p-5 my-5 bg-white">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-bold">{ localize(lang, "perf") }</h2>
          </div>

          <h3 className={`my-5 font-bold text-gray-900`}> {localize(lang, "CPU")} </h3>
          <div className="w-full">
            <Chart type="line" options={getPerfChartOptions(lang, 600)} plugins={[]} data={cpuData} />
          </div>
          <h3 className={`my-5 font-bold text-gray-900`}> {localize(lang, "memory")} </h3>
          <div className="w-full">
            <Chart type="line" options={getMemChartOptions(lang, 700)} plugins={[corsair]} data={memData} />
          </div>
          <h3 className={`my-5 font-bold text-gray-900`}> {localize(lang, "disk")} </h3>
          <div className="w-full">
            <Chart type="line" options={getDiskChartOptions(lang, 800)} plugins={[corsair]} data={diskData}/>
          </div>
        </div>

        <div id="streaming-section" className="shadow rounded-lg p-5 my-5 w-full bg-white "> {/* card */}
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-bold">{ localize(lang, "streaming") }</h2>
            <Button type="link" href="/dashboard/rooms/">
              { localize(lang, "more") }
            </Button>
          </div>
          <div className="mt-5 w-full text-gray-600 overflow-x-scroll scrollbar-hidden">
            <table className={`streaming-table w-full text-left`}>
              <thead className="text-gray-500 text-xs border-b">
                <tr className="uppercase whitespace-nowrap">
                  <th className="">{localize(lang, "room_id")}</th>
                  <th>{ localize(lang, "room_title") }</th>
                  <th>{ localize(lang, "room_viewers") }</th>
                  <th>{ localize(lang, "room_streamed_for") }</th>
                  <th>{ localize(lang, "room_owner") }</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                { rooms.map((room) => (
                  <tr key={room.id} className="text-black">
                    <th className="code">{ room.id }</th>
                    <th>{ room.title }</th>
                    <th>{ room.viewers }</th>
                    <th>{ humanizeTimeDiff(Math.abs(new Date().getTime() - new Date(room.last_streaming).getTime())) }</th>
                    <th>{ room.owner_username }</th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
