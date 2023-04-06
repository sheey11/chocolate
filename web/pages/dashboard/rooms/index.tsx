import { Nav } from "@/components/Nav/Nav";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { dashboardNavs } from "@/constants/navs"
import { RectangleStackIcon, PlayCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { localize } from "@/i18n/i18n";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button/Button";
import { Footer } from "@/components/Footer/Footer";
import { RoomStatsResponse } from "@/api/v1/datatypes";
import { fetchRoomStats } from "@/api/v1/stat";

const roomStatus = [
  { name: "all", indicator_class: "bg-blue-500" },
  { name: "active", indicator_class: "bg-green-500" },
  { name: "idle", indicator_class: "bg-gray-500" },
]

export default function RoomIndex() {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const lang = router.locale!

  const [roomStats, setRoomStats] = useState<RoomStatsResponse | null>(null)

  const [roomFilterStatus, setRoomFilterStatus] = useState('all')

  useEffect(() => {
    fetchRoomStats()
      .then(setRoomStats)
  }, [])

  return (
    <>
      <Nav navs={dashboardNavs} />
      <div className={`pt-5 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8`}>
        <div className="flex flex-row py-5 space-x-2 items-center">
          <h1 className="text-gray-800 text-3xl font-bold">
            { localize(lang, "rooms_page") }
          </h1>
          <button className="rounded focus:ring focus:ring-blue-500 transition duration-100 p-1"> {/* todo */}
            <ArrowPathIcon className="h-6 w-6 text-gray-400"/>
          </button>
        </div>
        <div className="flex flex-col space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          { /* card */ }
          <div className="shadow rounded-lg bg-white w-full p-5 flex flex-row items-center space-x-4">
            <span className="h-16 w-16 text-white rounded bg-blue-500 p-2">
              <RectangleStackIcon />
            </span>
            <div className="flex flex-col-reverse space-y-reverse space-y-2">
              <h2 className="text-gray-500">{ localize(lang, 'total_room') }</h2>
              <span className="text-2xl font-bold">
                { roomStats ? roomStats.total : 0 }
              </span>
            </div>
          </div>
          { /* card */ }
          <div className="shadow rounded-lg bg-white w-full p-5 flex flex-row items-center space-x-4">
            <span className="h-16 w-16 text-white rounded bg-green-500 p-2">
              <PlayCircleIcon />
            </span>
            <div className="flex flex-col-reverse space-y-reverse space-y-2">
              <h2 className="text-gray-500">{ localize(lang, 'streaming') }</h2>
              <span className="text-2xl font-bold">
                { roomStats ? roomStats.streaming : 0 }
              </span>
            </div>
          </div>
        </div>
        <div className="shadow rounded-lg my-5 bg-white p-5">
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row space-x-4 w-full justify-between md:w-fit md:justify-start">
              <div className="h-8 flex-2 w-full relative">
                <span className="absolute h-4 w-4 text-gray-500 inset-2">
                  <MagnifyingGlassIcon />
                </span>
                <input
                  className="block h-full w-full pl-8 appearance-none rounded border border-gray-200 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-200 sm:text-sm transition ease duration-200"
                  placeholder={localize(lang, 'search')}
                />
              </div>
              <div className="h-8 w-full">
                <Listbox value={roomFilterStatus} onChange={setRoomFilterStatus}>
                  <Listbox.Button className="h-full w-full md:w-48 relative py pr-2 pl-4 shadow-sm rounded border border-gray-200 flex items-center justify-between focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-200 transition duration-100">
                    <span className="truncate flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${roomStatus.find((v) => v.name == roomFilterStatus)!.indicator_class}`} />
                      <span className="text-left text-sm text-gray-600"> { localize(lang, `room_filter_status_${roomFilterStatus}`) } </span>
                    </span>
                    <span className="h-4 w-4 inline-block">
                      <ChevronUpDownIcon />
                    </span>
                  </Listbox.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Listbox.Options className="absolute mt-2 w-full bg-white z-20 rounded shadow-lg border border-gray-200 shadow">
                      {roomStatus.map((v) => (
                        <Listbox.Option
                          key={v.name}
                          value={v.name}
                          className={({ active }) => `h-8 w-full truncate flex items-center space-x-2 px-4 py-1 ${active ? "bg-gray-100 text-black" : "" } ${roomFilterStatus === v.name ? "font-bold" : "font-normal"}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${v.indicator_class}`}/>
                          <span className="text-left text-gray-600"> { localize(lang, `room_filter_status_${v.name}`) } </span>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </Listbox>
              </div>
            </div>
            { /*
            <div>
              <Button className="hidden md:block z-10">
                <span className="inline-block h-4 w-4 pt-[0.15rem]">
                  <PlusIcon />
                </span>
                <span> New room </span>
              </Button>
            </div>
            */ }
          </div>
          <div className="my-5 w-full overflow-x-scroll md:overflow-x-hidden">
            <table className="w-full">
              <thead className="text-gray-500 text-xs border-b">
                <tr className="uppercase whitespace-nowrap">
                  <th> Title </th>
                  <th> ID </th>
                  <th> Viewers </th>
                  <th> Owner </th>
                  <th> Streamed for </th>
                  <th> Status </th>
                  <th> </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="whitespace-nowrap">
                  <th> 冲水冲水 </th>
                  <th className="code">1919810</th>
                  <th> 114,514 </th>
                  <th> abc </th>
                  <th> 1h30min </th>
                  <th> Active </th>
                  <th>
                    <Button type="link" href="/dashboard/rooms/1">
                      Edit
                    </Button>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  )
}
