import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/router"
import { Fragment, useContext, useEffect } from "react"
import { dashboardNavs } from "@/constants/navs"
import { Inter } from "next/font/google"
import Button from "@/components/Button/Button"
import { useState } from 'react'
import { CheckIcon, HandThumbUpIcon, UserIcon, ArrowTopRightOnSquareIcon, PaperClipIcon, QuestionMarkCircleIcon, PlayIcon, PlayPauseIcon, NoSymbolIcon, } from '@heroicons/react/24/solid'
import { ArrowPathRoundedSquareIcon, ArrowSmallUpIcon, ExclamationTriangleIcon, SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline'
import Link from "next/link"
import { Footer } from "@/components/Footer/Footer"
import { localize } from "@/i18n/i18n"
import Dialog from "@/components/Dialog/Dialog"
import { AdminRoomDetailResponse, RoomTimelineResponse } from "@/api/v1/datatypes"
import { fetchRoomDetail, fetchRoomTimeline } from "@/api/v1/admin/room"
import { Listbox, Transition } from "@headlessui/react"
import "humanizer.node"

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


const attachments = [
  { name: 'resume_front_end_developer.pdf', href: '#' },
  { name: 'coverletter_front_end_developer.pdf', href: '#' },
]
const eventTypes = [
  { name: 'publish',   icon: SignalIcon, bgColorClass: 'bg-green-400' },
  { name: 'unpublish', icon: SignalSlashIcon, bgColorClass: 'bg-blue-500' },
  { name: 'play',      icon: PlayIcon, bgColorClass: 'bg-gray-500' },
  { name: 'stop',      icon: PlayPauseIcon, bgColorClass: 'bg-gray-500' },
  { name: 'cutoff',    icon: NoSymbolIcon, bgColorClass: 'bg-red-500' },
]

const comments = [
  {
    id: 1,
    name: 'Leslie Alexander',
    date: '4d ago',
    imageId: '1494790108377-be9c29b29330',
    body: 'Ducimus quas delectus ad maxime totam doloribus reiciendis ex. Tempore dolorem maiores. Similique voluptatibus tempore non ut.',
  },
  {
    id: 2,
    name: 'Michael Foster',
    date: '4d ago',
    imageId: '1519244703995-f4e0f30006d5',
    body: 'Et ut autem. Voluptatem eum dolores sint necessitatibus quos. Quis eum qui dolorem accusantium voluptas voluptatem ipsum. Quo facere iusto quia accusamus veniam id explicabo et aut.',
  },
  {
    id: 3,
    name: 'Dries Vincent',
    date: '4d ago',
    imageId: '1506794778202-cad84cf45f1d',
    body: 'Expedita consequatur sit ea voluptas quo ipsam recusandae. Ab sint et voluptatem repudiandae voluptatem et eveniet. Nihil quas consequatur autem. Perferendis rerum et.',
  },
]

export default function RoomDetailPage() {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const id = router.query.id as string | undefined
  const lang = router.locale!

  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)

  const [roomDetail, setRoomDetail] = useState<AdminRoomDetailResponse | null>(null)
  const [roomTimeline, setRoomTimeline] = useState<RoomTimelineResponse | null>(null)
  const [permissionTypeHelpShow, setPermissionTypeHelpShow] = useState<boolean>(false)

  const reloadDetail = (id: string | undefined) => {
    if(!id) return
    fetchRoomDetail(id)
      .then(setRoomDetail)
      .catch(e => console.error(e))
  }

  const loadRoomTimeline = (id: string | undefined) => {
    if(!id) return
    fetchRoomTimeline(id)
      .then(setRoomTimeline)
      .catch(e => console.error(e))
  }

  useEffect(() => {
    if (!id) return
    reloadDetail(id)
    loadRoomTimeline(id)
  }, [id])

  return (
    <>
      <Nav navs={dashboardNavs} />
      <main className={`pt-10 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 ${inter.className}`}>
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900"> { roomDetail?.rooms.title }</h1>
                <div className="ml-2">
                  { roomDetail?.rooms.status === "streaming" ? 
                    <span className="h-2 w-2 rounded-full bg-green-500 block">
                      <span className="absolute h-2 w-2 rounded-full bg-green-500 block animate-ping" />
                    </span>
                    :
                    <span className="h-2 w-2 rounded-full bg-gray-500 block" />
                  }
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                { roomDetail?.rooms.status === "streaming" ? localize(lang, "stream_started_at") : localize(lang, "last_streamed_at") }{' '}
                <time dateTime={roomDetail?.rooms.last_streaming}>
                  { roomDetail ?
                    function() {
                      const date = new Date(roomDetail.rooms.last_streaming)
                      return date.toLocaleTimeString("en-US") + " " + date.toLocaleDateString("zh-CN")
                    }()
                    :
                    "unknown" }
                </time>
              </p>
            </div>
          </div>
          <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button type="secondary" className="text-red-500" ring="red">{ localize(lang, "cut_off_stream") }</Button>
            <Button onClick={() => setDeleteConfirmDialogOpen(true)} type="destructive">{ localize(lang, "delete_room") }</Button>

            <Dialog open={deleteConfirmDialogOpen} onClose={() => setDeleteConfirmDialogOpen(false)}>
              <Dialog.Content>
                <div className="flex flex-row space-x-4 items-start">
                  <span className="p-2 rounded-full bg-red-200">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500"/>
                  </span>
                  <div className="w-full">
                    <h2 className="font-semibold text-md"> Deletion Confirm </h2>
                    <p> The room <code>{ roomDetail?.rooms.id }</code> deletion cannot be undone! </p>
                  </div>
                </div>
              </Dialog.Content>
              <Dialog.Actions>
                <Button type="secondary"> Cancel </Button>
                <Button type="destructive"> Delete </Button>
              </Dialog.Actions>
            </Dialog>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2 lg:col-start-1">
            {/* Description list*/}
            <section aria-labelledby="room-information-title">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex items-center justify-start">
                  <h2 id="room-information-title" className="text-lg font-medium leading-6 text-gray-900">
                    { localize(lang, "room_info") }
                  </h2>
                  <button
                    className="h-6 w-6 p-1 mx-2 rounded-sm focus:outline-none focus:ring focus:ring-blue-500 transition duration-200"
                    onClick={() => reloadDetail(id)}
                  >
                    <ArrowPathRoundedSquareIcon />
                  </button>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">ID</dt>
                      <dd className="mt-1 text-gray-900 code">{ roomDetail?.rooms.id }</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">UID</dt>
                      <dd className="mt-1 text-md text-gray-900 overflow-x-scroll scrollbar-hidden code select-none">
                        { roomDetail?.rooms.uid }
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">{ localize(lang, "room_owner") }</dt>
                      <dd className="mt-1 text-sm text-gray-900 hover:text-gray-600 transition duration-100">
                        <Link target="_blank" href={`/dashboard/users/${roomDetail?.rooms.owner_id}`}>
                          { roomDetail?.rooms.owner_username }
                          <ArrowTopRightOnSquareIcon className="inline-block h-4 w-4"/>
                        </Link>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                        <span> { localize(lang, "room_permission_type") } </span>

                        <button
                          className="relative cursor-default"
                          onMouseEnter={() => setPermissionTypeHelpShow(true)}
                          onMouseLeave={() => setPermissionTypeHelpShow(false)}
                          onClick={() => setPermissionTypeHelpShow(true)}
                        >
                          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400"/>
                          <Transition
                            as={Fragment}
                            show={permissionTypeHelpShow}
                            enter="transition ease-out duration-50 origin-top-left"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="transition ease-in duration-50 origin-top-left"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                          >
                            <dl className="absolute p-4 w-72 whitespace-pre-line border rounded shadow bg-white text-left z-20">
                              <dt className="font-medium block text-black">{ localize(lang, "room_permission_type_whitelist") }</dt>
                              <dd>{ localize(lang, "room_permission_type_whitelist_explain") }</dd>
                              <dt className="font-medium block text-black mt-2">{ localize(lang, "room_permission_type_blacklist") }</dt>
                              <dd>{ localize(lang, "room_permission_type_blacklist_explain") }</dd>
                            </dl>
                          </Transition>
                        </button>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        { localize(lang, `room_permission_type_${roomDetail?.rooms.permission_type}`) }
                        { /*
                          <Listbox value={roomDetail?.rooms.permission_type}>
                            <Listbox.Button className="relative rounded">
                                { localize(lang, `room_permission_type_${roomDetail?.rooms.permission_type}`) }
                              <PencilSquareIcon className="inline-block h-4 w-4 ml-2 mb-1" />
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-50 origin-top"
                              enterFrom="opacity-0 scale-95"
                              enterTo="opacity-100 scale-100"
                              leave="transition ease-in duration-50 origin-top"
                              leaveFrom="opacity-100 scale-100"
                              leaveTo="opacity-0 scale-95"
                            >
                              <Listbox.Options className="absolute bg-white z-20 border border-gray-100 rounded shadow-lg divide-y">
                                <Listbox.Option as="button" value="blacklist" className="flex items-center space-x-2 py-3 px-4">
                                  <UserMinusIcon className="h-5 w-5"/>
                                  <span> { localize(lang, `room_permission_type_blacklist`) } </span>
                                </Listbox.Option>
                                <Listbox.Option as="button" value="whitelist" className="flex items-center space-x-2 py-3 px-4">
                                  <UserPlusIcon className="h-5 w-5"/>
                                  <span> { localize(lang, `room_permission_type_whitelist`) } </span>
                                </Listbox.Option>
                              </Listbox.Options>
                            </Transition>
                          </Listbox>
                        */ }
                      </dd>
                    </div>
                    { roomDetail?.rooms.srs_stream ?
                      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 w-full sm:col-span-2 relative pt-2">
                        <div className="absolute -inset-4 bg-blue-50 sm:rounded-lg z-5" aria-hidden/>
                        <div className="absolute -top-10 right-2 flex items-center p-2 bg-white rounded-lg border border-gray-100" aria-hidden>
                          <span className="text-sm px-1">
                            { localize(lang, "data_provided_by") }
                          </span>
                          <span className="block font-bold text-lg text-white bg-blue-700 px-2 rounded transform skew-y-3">
                            SRS
                          </span>
                        </div>
                        <div className="sm:col-span-1 z-10">
                          <dt className="text-sm font-medium text-gray-500">
                            { localize(lang, "viewers") }
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            { roomDetail.rooms.srs_stream.clients - 1 }
                          </dd>
                        </div>
                        <div className="sm:col-span-1 z-10">
                          <dt className="text-sm font-medium text-gray-500">
                            { localize(lang, "send_bytes") } / { localize(lang, "recv_bytes") }
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            { humanizeSize(roomDetail.rooms.srs_stream.send_bytes) } / { humanizeSize(roomDetail.rooms.srs_stream.recv_bytes) }
                          </dd>
                        </div>
                        <div className="sm:col-span-1 z-10">
                          <dt className="text-sm font-medium text-gray-500">
                            { localize(lang, "video_encoding") }
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className="code">
                              { roomDetail.rooms.srs_stream.video.codec }
                            </span>
                            <span className="mx-1 px-1 text-xs bg-blue-500 text-white rounded-sm">
                              { roomDetail.rooms.srs_stream.video.profile }
                            </span>
                            <span className="mx-1 px-1 text-xs bg-blue-500 text-white rounded-sm">
                              { roomDetail.rooms.srs_stream.video.width }x{ roomDetail.rooms.srs_stream.video.height }
                            </span>
                          </dd>
                        </div>
                        <div className="sm:col-span-1 z-10">
                          <dt className="text-sm font-medium text-gray-500">
                            { localize(lang, "audio_encoding") }
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className="code">
                              { roomDetail.rooms.srs_stream.audio.codec }
                            </span>
                            <span className="mx-1 px-1 text-xs bg-blue-500 text-white rounded-sm">
                              { roomDetail.rooms.srs_stream.audio.sample_rate } Hz
                            </span>
                          </dd>
                        </div>
                      </div>
                      :
                      <></>
                    }
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">{ localize(lang, `room_permission_type_${roomDetail?.rooms.permission_type}`) }</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul role="list" className="divide-y divide-gray-200 rounded-md border border-gray-200">
                          <li className="flex items-center justify-between py-2 pl-2 pr-4 text-sm">
                            <UserIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                          </li>
                        </ul>
                        <ul role="list" className="divide-y divide-gray-200 rounded-md border border-gray-200">
                          {attachments.map((attachment) => (
                            <li
                              key={attachment.name}
                              className="flex items-center justify-between py-3 pl-3 pr-4 text-sm"
                            >
                              <div className="flex w-0 flex-1 items-center">
                                <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 w-0 flex-1 truncate">{attachment.name}</span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a href={attachment.href} className="font-medium text-blue-600 hover:text-blue-500">
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            {/* Comments*/}
            <section aria-labelledby="notes-title">
              <div className="bg-white shadow sm:overflow-hidden sm:rounded-lg">
                <div className="divide-y divide-gray-200">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 id="notes-title" className="text-lg font-medium text-gray-900">
                      Notes
                    </h2>
                  </div>
                  <div className="px-4 py-6 sm:px-6">
                    <ul role="list" className="space-y-8">
                      {comments.map((comment) => (
                        <li key={comment.id}>
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={`https://images.unsplash.com/photo-${comment.imageId}?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`}
                                alt=""
                              />
                            </div>
                            <div>
                              <div className="text-sm">
                                <a href="#" className="font-medium text-gray-900">
                                  {comment.name}
                                </a>
                              </div>
                              <div className="mt-1 text-sm text-gray-700">
                                <p>{comment.body}</p>
                              </div>
                              <div className="mt-2 space-x-2 text-sm">
                                <span className="font-medium text-gray-500">{comment.date}</span>{' '}
                                <span className="font-medium text-gray-500">&middot;</span>{' '}
                                <button type="button" className="font-medium text-gray-900">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-6 sm:px-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                    </div>
                    <div className="min-w-0 flex-1">
                      <form action="#">
                        <div>
                          <label htmlFor="comment" className="sr-only">
                            About
                          </label>
                          <textarea
                            id="comment"
                            name="comment"
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Add a note"
                            defaultValue={''}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <a
                            href="#"
                            className="group inline-flex items-start space-x-2 text-sm text-gray-500 hover:text-gray-900"
                          >
                            <QuestionMarkCircleIcon
                              className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                              aria-hidden="true"
                            />
                            <span>Some HTML is okay.</span>
                          </a>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Comment
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 lg:col-start-3">
            <section aria-labelledby="stream-preview-title">
              <div className="bg-white px-4 py-5 mb-5 shadow sm:rounded-lg sm:px-6">
                <div className="flex justify-between">
                  <h2 id="stream-preview-title" className="text-lg font-medium text-gray-900">
                    { localize(lang, 'room_stream_preview') }
                  </h2>
                  <Button type="link" href="/live/114514" size="small">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-900"/>
                  </Button>
                </div>
                <div className="h-48 w-full mt-5 bg-blue-100">
                </div>
                {/* TODO */}
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
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
