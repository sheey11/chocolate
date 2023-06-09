import { Nav } from "@/components/Nav/Nav";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { dashboardNavs } from "@/constants/navs"
import { RectangleStackIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  Bars3CenterLeftIcon,
  KeyIcon,
  UserIcon,
  UserGroupIcon,
  PlayCircleIcon as PlayCircleIconOutline, 
  PlayPauseIcon,
  ArrowPathRoundedSquareIcon 
} from "@heroicons/react/24/outline"
import { localize, localizeError } from "@/i18n/i18n";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button/Button";
import { Footer } from "@/components/Footer/Footer";
import { ListRoomAdminResponse, RoomInfoResponse, RoomStatsResponse } from "@/api/v1/datatypes";
import { fetchRoomStats } from "@/api/v1/stat";
import { classNames } from "@/utils/classnames";
import { JetBrains_Mono } from "next/font/google";
import { fetchRooms } from "@/api/v1/admin/room";
import Pagination from "@/components/Pagination/Pagination";
import Link from "next/link";
import debounce from "@/utils/debounce";
import { TitleContext } from "@/contexts/TitleContext";

const roomStatus = [
  { name: "all", indicator_class: "bg-blue-500" },
  { name: "streaming", indicator_class: "bg-green-500" },
  { name: "idle", indicator_class: "bg-gray-500" },
]

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
})

export default function RoomIndex() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const lang = router.locale!

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const [roomStats, setRoomStats] = useState<RoomStatsResponse     | null>(null)
  const [rooms,     setRooms    ] = useState<ListRoomAdminResponse | null>(null)

  const [roomFilterStatus, setRoomFilterStatus] = useState<'all' | 'streaming' | 'idle'>('all')
  const [search,           setSearch          ] = useState<string | undefined>()
  const [page,             setPage            ] = useState<number>(1)
  const [maxPage,          setMaxPage         ] = useState<number>(1)

  const searchRef = useRef<HTMLInputElement | null>(null)

  const { setTitle } = useContext(TitleContext)
  useEffect(() => {
    setTitle(["dashboard", "rooms_page"].map((v) => localize(lang, v)))
  }, [])

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
  const handleSearchInputChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, 600)

  const dealWithFetchError = (e: any) => {
    console.error(e)
    if(!e.response || !e.response.data || !e.response.data.code) {
      setErrCode(-1)
      setHttpErrCode(503)
      return
    }
    setErrCode(e.response.data.code)
    setHttpErrCode(e.response.status)
  }

  const refreshStats = useCallback(() => {
    fetchRoomStats()
      .then(setRoomStats)
      .catch((e) => {
        dealWithFetchError(e)
      })
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  useEffect(() => {
    const status = roomFilterStatus === "all" ? undefined :
      (roomFilterStatus === "streaming" ? 1 : 0)
    fetchRooms({ search, status, limit: 10, page})
      .then(rooms => {
        setRooms(rooms)
        setMaxPage(Math.ceil(rooms.total / 10))
      })
      .catch(dealWithFetchError)
  }, [roomFilterStatus, search, page])

  if(!authenticated || getUser()?.role != "administrator") {
    return (
      <>
        <Nav navs={dashboardNavs} />
        <main className="mx-auto max-w-7xl lg:pt-8 h-[calc(100vh-13rem)] md:h-[calc(100vh-14.5rem)] flex flex-col items-center justify-center">
          <h1 className={ classNames("text-7xl", jbm.className) }>{ 403 }</h1>
          <span className="text-sm text-gray-600 font-bold">
            { localizeError(lang, 13) }
          </span>
        </main>
        <Footer />
      </>
    )
  }

  if(errCode && httpErrCode) {
    return (
      <>
        <Nav navs={dashboardNavs} />
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
        <Nav navs={dashboardNavs} />
        <main className={`pt-5 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8`}>
          <div className="flex flex-row py-5 space-x-2 items-center">
            <h1 className="text-gray-800 text-3xl font-bold">
              { localize(lang, "rooms_page") }
            </h1>
            <button
              className="ml-1 p-1 rounded-full focus:outline-none focus:ring focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              onClick={() => refreshStats()}
            >
              <ArrowPathRoundedSquareIcon className="h-4 w-4 text-gray-400"/>
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
          <div className="shadow rounded-lg my-5 bg-white p-5 flex flex-col space-y-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row space-x-4 w-full justify-between md:w-fit md:justify-start">
                <div className="h-8 flex-2 w-full relative">
                  <span className="absolute h-4 w-4 text-gray-500 inset-2">
                    <MagnifyingGlassIcon />
                  </span>
                  <input
                    ref={searchRef}
                    onChange={handleSearchInputChange}
                    className="block h-full w-full pl-8 appearance-none rounded border border-gray-200 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-200 sm:text-sm transition ease duration-200"
                    placeholder={localize(lang, 'search')}
                  />
                </div>
                <div className="h-8 w-full">
                  <Listbox value={roomFilterStatus} onChange={(v) => { setRoomFilterStatus(v); setPage(1) }}>
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
                            className={({ active }) => `h-8 w-full truncate px-4 py-1 ${active ? "bg-gray-100 text-black" : "" } ${roomFilterStatus === v.name ? "font-bold" : "font-normal"}`}
                          >
                            <button className="flex items-center space-x-2 w-full">
                              <span className={`h-2 w-2 rounded-full ${v.indicator_class}`}/>
                              <span className="text-left text-gray-600"> { localize(lang, `room_filter_status_${v.name}`) } </span>
                            </button>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </Listbox>
                </div>
              </div>
            </div>
            <div className="w-full h-full overflow-x-auto">
              <table className="w-full">
                <thead className="text-gray-500 text-xs border-b bg-gray-50">
                  <tr className="uppercase whitespace-nowrap text-left">
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <Bars3CenterLeftIcon className="h-4 w-4"/>
                        <span> { localize(lang, 'room_title') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <KeyIcon className="h-4 w-4" />
                        <span> { localize(lang, 'room_id') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <UserGroupIcon className="h-4 w-4" />
                        <span> { localize(lang, 'room_viewers') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span> { localize(lang, 'room_owner') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <PlayCircleIconOutline className="h-4 w-4" />
                        <span> { localize(lang, 'room_streamed_for') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <PlayPauseIcon className="h-4 w-4" />
                        <span> { localize(lang, 'room_status') } </span>
                      </span>
                    </th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  { rooms?.rooms.map((room) =>
                    <tr key={room.id} className="whitespace-nowrap text-left">
                      <th>{ room.title }</th>
                      <th className="code">{ room.id }</th>
                      <th>{ room.viewers }</th>
                      <th>
                        <Link href={`/dashboard/users/${room.owner_username}`} className="hover:text-gray-500 transition duration-200">
                          { room.owner_username }
                          <ArrowTopRightOnSquareIcon className="inline-block h-4 w-4"/>
                        </Link>
                      </th>
                      <th>{ humanizeTimeDiff(Math.abs(new Date().getTime() - new Date(room.last_streaming).getTime())) }</th>
                      <th>
                        <span className="flex flex-row items-center space-x-2">
                          { room.status === "streaming" ?
                            <span className="relative h-2 w-2 rounded-full bg-green-500 inline-block">
                              <span className="absolute h-2 w-2 rounded-full bg-green-500 block animate-ping" />
                            </span>
                            :
                            <span className="relative h-2 w-2 mr-0.5 rounded-full bg-gray-500 inline-block" />
                          }
                          <span> { localize(lang, `room_filter_status_${room.status}`) } </span>
                        </span>
                      </th>
                      <th>
                        <Button type="link" href={`/dashboard/rooms/${room.id}`}>
                          { localize(lang, "edit") }
                        </Button>
                      </th>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            { rooms?.rooms.length === 0 ?
              <div className="py-16 px-8 w-full h-full flex flex-col items-center justify-around space-y-2">
                <span className="text-8xl">😅</span>
                <span className="text-center w-full text-sm text-gray-600">{ localize(lang, "no_data") }</span>
              </div>
              :
              <></>
            }
            <div className="flex flex-row items-center justify-between mt-2 px-2">
              <span className="text-sm text-gray-500">
                { localize(lang, "total") } { rooms?.total }
              </span>
              <Pagination page={page} total={maxPage} handlePageSelection={setPage}/>
            </div>
          </div>
        </main>
      </div>
      <Footer/>
    </div>
  )
}
