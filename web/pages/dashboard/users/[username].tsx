import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/router"
import { Fragment, useCallback, useContext, useEffect } from "react"
import { dashboardNavs } from "@/constants/navs"
import { Inter, JetBrains_Mono } from "next/font/google"
import Button from "@/components/Button/Button"
import { useState } from 'react'
import { UserIcon, ArrowTopRightOnSquareIcon, QuestionMarkCircleIcon, PlayIcon, PlayPauseIcon, NoSymbolIcon, TagIcon, } from '@heroicons/react/24/solid'
import { ArrowPathRoundedSquareIcon, SignalIcon, SignalSlashIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline'
import Link from "next/link"
import { Footer } from "@/components/Footer/Footer"
import { localize, localizeError } from "@/i18n/i18n"
import Dialog from "@/components/Dialog/Dialog"
import { AdminAccountDetail, AdminRoomDetailResponse, RoomTimelineResponse } from "@/api/v1/datatypes"
import { cutoffRoomStream, deleteRoom, fetchRoomDetail, fetchRoomTimeline } from "@/api/v1/admin/room"
import { Transition } from "@headlessui/react"
import "humanizer.node"
import StreamVideoBox from "@/components/StreamVideoBox/StreamVideoBox"
import { fetchAccountDetail } from "@/api/v1/admin/account"

const colorSchemes = [
  "bg-blue-600",
  "bg-green-600",
  "bg-yellow-600",
  "bg-purple-600",
  "bg-pink-500",
  "bg-red-500",
  "bg-orange-600",
]

const inter = Inter({
  subsets: ['latin-ext'],
})

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

function humanizeSize(v: any) {
  v = Math.abs(v)
  let size = (v).bytes()

  if(size.kilobytes < 768) {
    return `${size.kilobytes.toFixed(0)} KB`
  } else if (size.megabytes < 768) {
    return `${size.megabytes.toFixed(1)} MB`
  } else if (size.gigabytes < 768) {
    return `${size.gigabytes.toFixed(1)} GB`
  } else if (size.terabytes < 768) {
    return `${size.terabytes.toFixed(1)} TB`
  }
  return `${v} KB`
}

const eventTypes = [
  { name: 'publish',   icon: SignalIcon, bgColorClass: 'bg-green-400' },
  { name: 'unpublish', icon: SignalSlashIcon, bgColorClass: 'bg-blue-500' },
  { name: 'play',      icon: PlayIcon, bgColorClass: 'bg-gray-500' },
  { name: 'stop',      icon: PlayPauseIcon, bgColorClass: 'bg-gray-500' },
  { name: 'cutoff',    icon: NoSymbolIcon, bgColorClass: 'bg-red-500' },
]

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
})

export default function RoomDetailPage() {
  const router = useRouter()
  const username = router.query.username as string | undefined
  const lang = router.locale!

  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [CutoffConfirmDialogOpen, setCutoffConfirmDialogOpen] = useState(false)

  const [accountDetail,          setAccountDetail         ] = useState<AdminAccountDetail   | null>(null)
  const [roomTimeline,                     setRoomTimeline] = useState<RoomTimelineResponse | null>(null)
  const [permissionTypeHelpShow, setPermissionTypeHelpShow] = useState<boolean>(false)

  const [playbackUrl, setPlaybackUrl] = useState<string | undefined>(undefined)

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const dealWithFetchError = (e: any) => {
    console.error(e)
    setErrCode(e.response?.data!.code)
    setHttpErrCode(e.response?.status)
  }

  const reloadDetail = useCallback((username: string | undefined) => {
    if(!username) return
    fetchAccountDetail(username)
      .then(r => setAccountDetail(r.user_info))
      .catch(dealWithFetchError)
  }, [])

  // const loadRoomTimeline = useCallback((username: string | undefined) => {
  //   if(!username) return
  //   fetchRoomTimeline(username)
  //     .then(setRoomTimeline)
  //     .catch(dealWithFetchError)
  // }, [])

  useEffect(() => {
    if (!username) return
    reloadDetail(username)
    // loadRoomTimeline(username)
  }, [username, reloadDetail])

  const handleCutoff = useCallback(() => {
    if(!username) return
    cutoffRoomStream(username)
      .then(() => {
        reloadDetail(username)
        setCutoffConfirmDialogOpen(false)
      })
      .catch(dealWithFetchError)
  }, [username, reloadDetail])

  const handleDelete = useCallback(() => {
    if(!username) return
    deleteRoom(username)
      .then(() => router.push("/dashboard/rooms"))
      .catch(dealWithFetchError)
  }, [username, router])

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
    <>
      <Nav navs={dashboardNavs} />
      <main className={`pt-10 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 space-y-5 ${inter.className}`}>
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 inline"> { accountDetail?.username }</h1>
            <p className="text-sm font-medium text-gray-500">
              { localize(lang, `user_filter_role_${ accountDetail?.role }`) }
            </p>
          </div>
          <div className="flex-shrink-0 justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button onClick={() => setDeleteConfirmDialogOpen(true)} type="destructive">{ localize(lang, "delete_account") }</Button>
            <Dialog open={deleteConfirmDialogOpen} onClose={() => setDeleteConfirmDialogOpen(false)}>
              <Dialog.Content>
                <div className="flex flex-row space-x-4 items-start">
                  <span className="p-2 rounded-full bg-red-200">
                    <TrashIcon className="h-6 w-6 text-red-500"/>
                  </span>
                  <div className="w-full">
                    <h2 className="font-semibold text-md">{ localize(lang, "delete_confirm") }</h2>
                    <p>
                      { localize(lang, "the_account") } {' '}
                      <code className="code">{ accountDetail?.username }</code>
                      {' '}{ localize(lang, "delete_cannot_be_undone") }
                    </p>
                  </div>
                </div>
              </Dialog.Content>
              <Dialog.Actions>
                <Button type="secondary" onClick={() => setDeleteConfirmDialogOpen(false)}>{ localize(lang, "cancel") }</Button>
                <Button type="destructive" onClick={handleDelete}>{ localize(lang, "delete_confirm_btn") }</Button>
              </Dialog.Actions>
            </Dialog>
          </div>
        </div>

        {/* Description list*/}
        <section aria-labelledby="account-information-title">
          <div className="md:pb-2 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-start">
              <h2 id="account-information-title" className="text-lg font-medium leading-6 text-gray-900">
                { localize(lang, "account-info") }
              </h2>
              <button
                className="h-6 w-6 p-1 mx-2 rounded-sm focus:outline-none focus:ring focus:ring-blue-500 transition duration-200"
                onClick={() => reloadDetail(username)}
              >
                <ArrowPathRoundedSquareIcon />
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-gray-900 code">{ accountDetail?.id }</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{ localize(lang, "username") }</dt>
                  <dd className="mt-1 text-md text-gray-900 overflow-x-scroll scrollbar-hidden code select-none">
                    { accountDetail?.username }
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{ localize(lang, "user_role") }</dt>
                  <dd className="mt-1 text-sm text-gray-900 hover:text-gray-600 transition duration-100">
                    { localize(lang, `user_filter_role_${ accountDetail?.role }`) }
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                    <span> { localize(lang, "user_max_rooms") } </span>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 hover:text-gray-600 transition duration-100">
                    { accountDetail?.max_rooms }
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                    <span> { localize(lang, "user_labels") } </span>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 hover:text-gray-600 transition duration-100">
                    { accountDetail?.labels.length === 0 ?
                      <span>{ localize(lang, "account_have_no_label") }</span>
                      :
                      <ul role="list" className="flex flex-wrap space-x-2">
                        {accountDetail?.labels.map((label) => (
                          <li key={label} className="my-1 flex space-x-2 items-center py-2 px-3 rounded-lg border-2 border-gray-300 border-dashed">
                            <div className="h-5 w-5 p-1 rounded-full bg-yellow-500 text-white flex-shrink-0">
                              <TagIcon />
                            </div>
                            <div className="text-sm">
                              { label }
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Rooms */}
        <section aria-labelledby="permisstion-items-title">
          <div className="bg-white shadow sm:overflow-hidden sm:rounded-lg">
            <div className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h2 id="permission-items-title" className="text-lg font-medium text-gray-900">
                  { localize(lang, `account_rooms_title`) }
                </h2>
              </div>
              { accountDetail?.rooms.length === 0 ?
                <div className="p-8 flex flex-col space-around items-center space-y-2">
                  <span className="text-8xl">😅</span>
                  <span className="text-center w-full text-sm text-gray-600">{ localize(lang, "no_data") }</span>
                </div>
                :
                <div className="px-4 py-6 sm:px-6">
                  <ul role="list" className="gap-6 grid md:grid-cols-4 sm:grid-cols-1">
                    {accountDetail?.rooms.map((room, index) => (
                      <li key={room.id} className="w-full">
                        <button
                          type="button"
                          className="w-full flex items-stretch rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ease-in-out duration-300"
                          onClick={() => router.push(`/dashboard/rooms/${room.id}`) }
                        >
                          <div className={classNames(
                            "h-16 w-16 p-1 text-white flex-shrink-0 flex items-center justify-around text-md",
                            colorSchemes[index % colorSchemes.length],
                          )}>
                            { room.title.at(0) }
                          </div>
                          <div className="text-sm rounded-r-lg border-gray-300 border-2 border-l-0 w-full flex items-center justify-around pl-3">
                            <div className="w-full grid grid-rows-2 text-gray-600">
                              <div className="text-left text-[1rem] font-medium inline-flex items-center space-x-1">
                                <h2>{ room.title }</h2>
                                { room.status === 'streaming' ?
                                  <span aria-hidden className="w-2 h-2 rounded-full bg-green-500 relative bottom-[0.1rem]">
                                    <span className="absolute animate-ping w-2 h-2 rounded-full bg-green-500"/>
                                  </span>
                                  :
                                  <></>
                                }
                              </div>
                              <div className="w-full flex space-x-1 items-center">
                                <UsersIcon className="h-3 w-3"/>
                                <span className="text-[0.1rem]"> { room.viewers } </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              }
            </div>
          </div>
        </section>

        <section aria-labelledby="timeline-title">
          <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
            <h2 id="timeline-title" className="text-lg font-medium text-gray-900">
              {  localize(lang, "room_timeline") }
            </h2>

            {/* Activity Feed */}
            <div className="mt-6 flow-root">
              <ul role="list" className="-mb-8">
                { roomTimeline?.logs.map((item, itemIdx) => {
                  const event = eventTypes[item.type]
                  return (
                    <li key={item.time}>
                      <div className="relative pb-8">
                        {itemIdx !== roomTimeline.logs.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={classNames(
                                event.bgColorClass,
                                'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                              )}
                            >
                              <event.icon className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-black">
                                { localize(lang, event.name) }{' '}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <time dateTime={item.time}>{new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )})}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}
