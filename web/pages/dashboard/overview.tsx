import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { useContext, useEffect, useState } from "react"
import { ArrowPathIcon, ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/router"
import { localize, localizeError } from "@/i18n/i18n"

import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js"
import { Chart } from "react-chartjs-2"
import { Footer } from "@/components/Footer/Footer"

import { getNetworkChartOptions, getPerfChartOptions, getDiskChartOptions, corsair, getMiniChartOptions} from "@/constants/charts-config"
import { dashboardNavs } from "@/constants/navs"
import Button from "@/components/Button/Button"
import Link from "next/link"
import { JetBrains_Mono } from "next/font/google"
import { classNames } from "@/utils/classnames"
import SRSVersion from "@/components/SRSVersion/SRSVersion"
import { fetchHostInformation, HostInformation } from "@/api/v1/stat"

import * as predefinedData from "@/utils/charts-predefind-data"

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

  const { authenticated, getUser          } = useContext(AuthContext)
  const [ errCode,       setErrCode       ] = useState<number | null>()
  const [ httpErrCode,   setHttpErrCode   ] = useState<number | null>()

  const [ streamingData, setStreamingData ] = useState(predefinedData.getStreamingData([]))
  const [ viewersData,   setViewersData   ] = useState(predefinedData.getViewersData([]));
  const [ usersData,     setUsersData     ] = useState(predefinedData.getUsersData([]));
  const [ networkData,   setNetworkData   ] = useState(predefinedData.getNetworkData([], []));
  const [ cpuData,       setCpuData       ] = useState(predefinedData.getCpuData([]));
  const [ memData,       setMemData       ] = useState(predefinedData.getMemData([]));
  const [ diskData,      setDiskData      ] = useState(predefinedData.getDiskData([], []))

  const [hostInformation, setHostInformation] = useState<HostInformation | null>(null)

  useEffect(() => {
    fetchHostInformation()
      .then(info => {
        setHostInformation(info)
        console.log(info)
      })
      .catch((e) => {
        console.error(e)
        setHostInformation(null)
        setErrCode(e.response?.data.code)
        setHttpErrCode(e.response?.status)
      })
  }, [])

  useEffect(() => {
    if(!hostInformation) return
    setNetworkData(predefinedData.getNetworkData(hostInformation.network_outbound, hostInformation.network_inbound))
    setCpuData    (predefinedData.getCpuData    (hostInformation.cpu                                              ))
    setMemData    (predefinedData.getMemData    (hostInformation.mem                                              ))
    setDiskData   (predefinedData.getDiskData   (hostInformation.disk_read,        hostInformation.disk_write     ))
  }, [hostInformation])

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
            <button className="rounded-full focus:outline-none focus:ring focus:ring-offset-2 focus:ring-blue-500 border-none transition duration-200 p-1"> {/* todo */}
              <ArrowPathIcon className="h-5 w-5 text-gray-400"/>
            </button>
          </div>
          <SRSVersion/>
        </div>
        <div className="grid lg:grid-cols-4 lg:grid-rows-1 md:grid-cols-2 md:grid-rows-2 sm:grid-cols-1 sm:grid-rows-4 gap-y-4 lg:gap-y-0 md:gap-x-4">
          <div className="bg-white rounded-lg shadow h-40 w-full text-blue-600 flex flex-col font-sans overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                100
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
          <div className="bg-white rounded-lg shadow h-40 w-full text-red-600 flex flex-col font-sans overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                65,535
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
          <div className="bg-white rounded-lg shadow h-40 w-full text-green-600 flex flex-col font-sans overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                65,535
              </h2>
              <span>
                { localize(lang, "viewers") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={60} options={getMiniChartOptions(300)} data={usersData}/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow h-40 w-full text-amber-500 flex flex-col font-sans overflow-hidden"> {/* card */}
            <div className="p-5 pb-0">
              <h2 className={`text-3xl font-bold`}>
                65,535
              </h2>
              <span>
                { localize(lang, "viewers") }
              </span>
            </div>
            <div className="w-full h-full overflow-hidden">
              <div className="min-w-full h-full mr-[-5px] ml-[-8px] mt-[5px]">
                <Chart type="line" height={60} options={getMiniChartOptions(400)} data={networkData}/>
              </div>
            </div>
          </div>
        </div>

        <div id="traffic" className="p-5 my-5 bg-white shadow rounded-lg">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-bold">{ localize(lang, "traffic") }</h2>
            <span> TODO: 天/星期/月 selection </span>
          </div>
          <div className="flex flex-row justify-between my-6">

            <div className="flex flex-col items-start">
              <span className={`font-bold text-lg`}>12,345</span>
              <span className={`text-gray-500 text-sm`}>
                { localize(lang, "connections") }
              </span>
            </div>

            <div className="flex flex-row space-x-4">
              <div className="flex flex-row space-x-1">
                <span className="inline-block h-5 w-5 mt-1 text-purple-500">
                  <ArrowUpIcon />
                </span>
                <span className="flex flex-col items-start">
                  <span className={`font-bold text-lg`}>
                    123Mbps
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
                    123Mbps
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
            <Chart type="line" options={getPerfChartOptions(lang, 700)} plugins={[corsair]} data={memData} />
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
          <div className="mt-5 w-full text-gray-600 font-sans">
            <table className={`streaming-table w-full text-left`}>
              <thead className="text-xs text-black font-bold border-b border-gray-300 uppercase">
                <tr>
                  <th className="pl-[1.6rem]"> Room ID </th>
                  <th> Title </th>
                  <th> Viewers </th>
                  <th> Streamd for </th>
                  <th> Owner </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <th>123456</th>
                  <th>冲水</th>
                  <th>114514</th>
                  <th>3h50min</th>
                  <th>abcdefg</th>
                </tr>
                <tr>
                  <th>123456</th>
                  <th>冲水</th>
                  <th>114514</th>
                  <th>3 hour 50 min</th>
                  <th>abcdefg</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
