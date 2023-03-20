import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { useContext } from "react"
import { ArrowPathIcon, ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/router"
import { localize } from "@/i18n/i18n"

import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js"
import { Chart } from "react-chartjs-2"
import { Footer } from "@/components/Footer/Footer"

import { getNetworkChartOptions, getPerfChartOptions, getDiskChartOptions, corsair, getMiniChartOptions} from "@/constants/charts-config"
import { dashboardNavs } from "@/constants/navs"
import Button from "@/components/Button/Button"
import Link from "next/link"

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const streamingData = {
  labels: [...Array(11).fill(0)],
  datasets: [{
    label: "streaming",
    fill: {
      target: 'origin',
      above: 'rgba(79, 70, 229, 0.1)',
    },
    data: [5, 5, 3, 2, 5, 6, 4, 2, 4, 6, 7],
    borderColor: 'rgb(79, 70, 229)',
    tension: 0.4,
  }],
}

const viewersData = {
  labels: [...Array(11).fill(0)],
  datasets: [{
    label: "streaming",
    fill: {
      target: 'origin',
      above: 'rgba(220, 38, 38, 0.1)',
    },
    data: [10, 5, 3, 2, 5, 6, 4, 2, 4, 6, 7],
    borderColor: 'rgb(220, 38, 38)',
    tension: 0.4,
  }],
}

const usersData = {
  labels: [...Array(11).fill(0)],
  datasets: [{
    label: "streaming",
    fill: {
      target: 'origin',
      above: 'rgba(22, 163, 74, 0.1)',
    },
    data: [10, 5, 3, 2, 5, 6, 4, 2, 4, 6, 7],
    borderColor: 'rgb(22, 163, 74)',
    tension: 0.4,
  }],
}

const networkData = {
  labels: Array(180).fill(0),
  datasets: [
    {
      label: 'outbound',
      data: Array(180).fill(0).map((_) => Math.random() * 1e9 + 1e8),
      tension: 0,
      borderColor: 'rgb(139, 92, 246)',
      fill: {
        target: 'origin',
        above: 'rgba(139, 92, 246, 0.1)',
      },
    },
    {
      label: 'inbound',
      data: Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
      tension: 0,
      borderColor: 'rgb(20, 184, 166)',
      fill: {
        target: 'origin',
        below: 'rgba(20, 184, 166, 0.1)',
      },
    }
  ],
}

const cpuData = {
  labels: Array(180).fill(0),
  datasets: [
    {
      label: 'CPU',
      data: Array(180).fill(0).map((_) => Math.random()),
      tesion: 0,
      borderColor: 'rgb(244, 63, 94)',
      fill: {
        target: 'origin',
        above: 'rgba(244, 63, 94, 0.1)',
      },
    }
  ]
}

const memData = {
  labels: Array(180).fill(0),
  datasets: [
    {
      label: 'memory',
      data: Array(180).fill(0).map((_) => Math.random()),
      tesion: 0,
      borderColor: 'rgb(251, 191, 36)',
      fill: {
        target: 'origin',
        above: 'rgba(251, 191, 36, 0.1)',
      },
    }
  ]
}

const diskData = {
  labels: Array(180).fill(0),
  datasets: [
    {
      label: 'disk_read',
      data: Array(180).fill(0).map((_) => Math.random() * 1e9 + 1e8),
      tesion: 0,
      borderColor: 'rgb(139, 92, 246)',
      fill: {
        target: 'origin',
        above: 'rgba(139, 92, 246, 0.1)',
      },
    },
    {
      label: 'disk_write',
      data: Array(180).fill(0).map((_) => -(Math.random() * 1e9 + 1e8)),
      tesion: 0,
      borderColor: 'rgb(20, 184, 166)',
      fill: {
        target: 'origin',
        below: 'rgba(20, 184, 166, 0.1)',
      },
    }
  ]
}

export default function AdminPage () {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const lang = router.locale!

  return (
    <>
      <Nav navs={dashboardNavs} user={{ name: user?.username!, role: user?.role! }}/>
      <main className="pt-5 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex flex-row py-5 space-x-2 items-center">
          <h1 className="text-gray-800 text-3xl font-bold">
            { localize(lang, "overview") }
          </h1>
          <button className="rounded focus:ring focus:ring-blue-200 transition duration-100 p-1"> {/* todo */}
            <ArrowPathIcon className="h-6 w-6 text-gray-400"/>
          </button>
        </div>
        <div className="grid lg:grid-cols-4 lg:grid-rows-1 md:grid-cols-2 md:grid-rows-2 sm:grid-cols-1 sm:grid-rows-4 gap-y-4 lg:gap-y-0 md:gap-x-4">
          <div className="bg-white rounded-lg shadow h-40 w-full text-indigo-600 flex flex-col font-sans overflow-hidden"> {/* card */}
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
                <span className="inline-block h-5 w-5 mt-1 text-indigo-500">
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
            <Button type="link">
              <Link href="/dashboard/rooms/">
                { localize(lang, "more") }
              </Link>
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
