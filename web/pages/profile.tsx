import { SelfInfoResponse, OwnedRoomInformation, OwnedRoomInfoResponse, ChocolcateResponse } from "@/api/v1/datatypes";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import { dashboardNavs, userNavs } from "@/constants/navs";
import { AuthContext } from "@/contexts/AuthContext";
import { localize, localizeError } from "@/i18n/i18n";
import { classNames } from "@/utils/classnames";
import { useRouter } from "next/router";
import { fetchCurrentUserInfo } from "@/api/v1/account";
import { ChangeEvent, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUpDownIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { TagIcon, UserIcon } from '@heroicons/react/24/solid'
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { addRoomPermissionItem, deleteRoomPermissionItem, fetchOwnedRoomInfo, startStreaming, stopStreaming, updateRoomPermissionType, updateRoomTitle } from "@/api/v1/room";
import { PlayCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import MessageQueue, { MessageQueueHandle } from "@/components/MessageQueue/MessageQueue";
import { AxiosError } from "axios";
import debounce from "@/utils/debounce";

function SelectRoomFirstHint() {
  const lang = useRouter().locale!
  return (
    <div className="h-96 w-full flex flex-col items-center justify-around">
      <div className="flex flex-col items-center space-y-2">
        <span className="text-8xl">🫠</span>
        <span className="text-center w-full text-sm text-gray-600">{ localize(lang, "select-room-to-setup-hint") }</span>
      </div>
    </div>
  );
}

const colorPattles = [
  "bg-blue-600",
  "bg-green-600",
  "bg-yellow-600",
  "bg-purple-600",
  "bg-pink-500",
  "bg-red-500",
  "bg-orange-600",
]

export default function ProfilePage() {
  const lang = useRouter().locale!
  const mqRef = useRef<MessageQueueHandle | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const [ selectedRoom, setSelectedRoom ] = useState<OwnedRoomInformation | null>()
  const [ selectedRoomDetail, setSelectedRoomDetail ] = useState<OwnedRoomInfoResponse | null>()
  const [ permissionTypeHelpShow, setPermissionTypeHelpShow ] = useState<boolean>(false)
  const [ roomPermissionType, setRoomPermissionType ] = useState<'blacklist' | 'whitelist'>('blacklist')
  const [ roomStreamKey, setRoomStreamKey] = useState<string | null>(null)

  const [ user, setUser ] = useState<SelfInfoResponse | null>(null)

  const showErrorMessage = (e: AxiosError<ChocolcateResponse>) => {
    console.error(e)
    mqRef.current?.error(localizeError(lang, e.response?.data!.code), localize(lang, "error_occurred"))
  }

  const showSuccessMessage = () => {
    mqRef.current?.success(localize(lang, "successfully_saved"), localize(lang, "success"), true)
  }

  const nav = useMemo(() => 
    getUser()?.role === 'administrator' ? dashboardNavs : userNavs
    , [getUser]);

  const dealWithFetchError = (e: any) => {
    console.error(e)
    setErrCode(e.response?.data!.code)
    setHttpErrCode(e.response?.status)
  }

  const reloadInfo = useCallback(() => {
    fetchCurrentUserInfo()
      .then(setUser)
      .catch(dealWithFetchError)
  }, []);

  const reloadSelectedRoomDetail = useCallback((id: number) => {
    fetchOwnedRoomInfo(id)
      .then((r) => {
        setSelectedRoomDetail(r)
      })
      .catch(dealWithFetchError)
  }, [])

  useEffect(() => {
    if(!titleRef.current || !selectedRoomDetail) return
    titleRef.current.value = selectedRoomDetail.title
  }, [titleRef, selectedRoomDetail]);

  useEffect(() => {
    reloadInfo()
  }, [reloadInfo]);

  useEffect(() => {
    if(!selectedRoom) return
    setRoomPermissionType(selectedRoom.permission_type)
    setRoomStreamKey(null)
    reloadSelectedRoomDetail(selectedRoom.id)
  }, [selectedRoom, reloadSelectedRoomDetail]);

  const handleRoomPermissionTypeChange = (type: "whitelist" | "blacklist") => {
    if(!selectedRoomDetail) return
    updateRoomPermissionType(selectedRoomDetail.id, roomPermissionType)
      .then(() => {
        setRoomPermissionType(type)
        showSuccessMessage()
      })
      .catch((e) => {
        showErrorMessage(e)
      })
  };

  const handleTitleChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    if(!selectedRoom) return
    updateRoomTitle(selectedRoom.id, e.target.value)
      .then(() => {
        showSuccessMessage()
        reloadInfo()
      })
      .catch(showErrorMessage)
  }, 500)

  const turnOnStream = (id: number) => {
    startStreaming(id)
      .then(r => {
        setRoomStreamKey(r.streamkey)
        reloadInfo()
        reloadSelectedRoomDetail(id)
        showSuccessMessage()
      })
      .catch(showErrorMessage)
  };

  const turnOffStream = (id: number) => {
    stopStreaming(id)
      .then(() => {
        setRoomStreamKey(null)
        reloadInfo()
        reloadSelectedRoomDetail(id)
        showSuccessMessage()
      })
      .catch(showErrorMessage)
  };

  const handlePermItemDelete = (type: "label" | "user", subject: string) => {
    if(!selectedRoomDetail) return
    deleteRoomPermissionItem(selectedRoomDetail.id, type, subject)
      .then(() => {
        showSuccessMessage()
        reloadSelectedRoomDetail(selectedRoomDetail.id)
      })
      .catch(showErrorMessage)
  };

  const handlePermItemAdd = (type: "label" | "user", subject: string) => {
    if(!selectedRoomDetail) return
    addRoomPermissionItem(selectedRoomDetail.id, type, subject)
      .then(() => {
        showSuccessMessage()
        reloadSelectedRoomDetail(selectedRoomDetail.id)
      })
      .catch(showErrorMessage)
  };

  const isWindows = () => {
    if(!navigator) return undefined

    // experimental feature,
    // see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform
    if((navigator as any).userAgentData?.platform) {
      return (navigator as any).userAgentData.platform === 'Windows'
    } else {
      return navigator.platform.indexOf("Windows") != -1
    }
  }

  if(!authenticated) {
    return (
      <>
        <Nav navs={dashboardNavs} />
        <main className="mx-auto max-w-7xl lg:pt-8 h-[calc(100vh-13rem)] md:h-[calc(100vh-14.5rem)] flex flex-col items-center justify-center">
          <h1 className="text-7xl font-jbm">{ 403 }</h1>
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
          <h1 className="text-7xl font-jbm">{ httpErrCode }</h1>
          <span className="text-sm text-gray-600 font-bold">
            { localizeError(lang, errCode) }
          </span>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[100vh] justify-between">
      <MessageQueue ref={mqRef} />
      <Nav navs={nav} />
      <main className="pt-10 pb-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 space-y-5 w-full grow">
        <section aria-labelledby="room-list-title">
          <div className="md:pb-2 bg-white shadow sm:rounded-lg">
            <div className="px-4 pb-2 py-5 sm:px-6 flex items-center justify-between">
              <h2 id="room-list-title" className="text-lg font-medium leading-6 text-gray-900">
                { localize(lang, "room-list") }
              </h2>
              <button className={classNames(
                "px-3 py-1 rounded border border-blue-600 bg-blue-600 text-sm text-white flex item-center space-x-2",
                "focus:ring focus:ring-blue-200",
                "transition duration-200",
                "hover:bg-blue-700",
              )}>
                <PlusIcon className="h-5 w-5"/>
                <span>{ localize(lang, "new-room-btn") }</span>
              </button>
            </div>
            { user?.rooms.length === 0 ?
              <div className="p-8 flex flex-col space-around items-center space-y-2">
                <span className="text-8xl">😢</span>
                <span className="text-center w-full text-sm text-gray-600">{ localize(lang, "you-have-no-room") }</span>
              </div>
              :
              <div className="py-3 px-6 border-t border-gray-200">
                <div className="hidden lg:flex justify-end">
                  <span className="text-xs">
                    Tips:{' '}
                    { localize(lang, "hold-key") }
                    <span className="bg-white border border-gray-300 rounded font-mono mx-1 px-1">shift</span>
                    { localize(lang, "to-scroll-horizontally") }
                  </span>
                </div>
                <ul role="list" className="flex flex-row overflow-x-auto space-x-4 py-2 px-4">
                  { user?.rooms.map((room, index) => (
                    <li
                      key={room.id}
                      className={classNames(
                        "rounded-lg w-full transition-shadow duration-200",
                        selectedRoom?.id === room.id ? "ring ring-blue-500 ring-offset-2" : "",
                      )}>
                      <button
                        type="button"
                        className="w-56 flex items-stretch rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ease-in-out duration-300"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className={classNames(
                          "h-16 w-16 p-1 text-white flex-shrink-0 flex items-center justify-around text-md",
                          colorPattles[index % colorPattles.length],
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
                              <UserIcon className="h-3 w-3"/>
                              <span className="text-[0.1rem]"> { room.viewers } </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                { selectedRoomDetail ?
                  <>
                    <section className="my-12 sm:mx-12">
                      <h1 className="font-bold text-sm my-4">{ localize(lang, "general-info") }</h1>
                      <dl className="divide-y divide-gray-100">
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900">ID</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0 code">
                            { selectedRoomDetail?.id }
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900">UID</dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0 code select-none">
                            { selectedRoomDetail?.uid }
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900">
                            { localize(lang, "room_title") }
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                            <input
                              type="input"
                              minLength={1}
                              maxLength={32}
                              ref={titleRef}
                              onChange={handleTitleChange}
                              className={classNames(
                                "max-w-full w-64 text-sm px-0",
                                "transition-all duraion-200 rounded py-1 hover:px-2 focus:px-2",
                                "border border-white/0 hover:border-gray-300 focus:border-gray-300",
                                "hover:shadow focus:shadow",
                                "focus:outline-none focus:ring focus:ring-blue-500",
                              )}/>
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 flex items-center space-x-1">
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
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                            <Listbox id="role-selection" as="div" value={roomPermissionType} onChange={handleRoomPermissionTypeChange}>
                              <div className="relative">
                                <Listbox.Button className={classNames(
                                  "w-full max-w-[16rem] py-1",
                                  "border border-white/0 hover:border-gray-300 hover:shadow-sm hover:px-2 hover-show",
                                  "rounded text-sm text-left flex items-center justify-between text-md",
                                  "transition-all duration-200",
                                )}>
                                  <span>
                                    { localize(lang, `room_permission_type_${roomPermissionType}`) }
                                  </span>
                                  <ChevronUpDownIcon className="h-4 w-4 text-gray-500 hover-show-subject"/>
                                </Listbox.Button>
                                <Transition
                                  enter="transition duration-100 ease-out"
                                  enterFrom="transform scale-95 opacity-0"
                                  enterTo="transform scale-100 opacity-100"
                                  leave="transition duration-75 ease-out"
                                  leaveFrom="transform scale-100 opacity-100"
                                  leaveTo="transform scale-95 opacity-0"
                                >
                                  <Listbox.Options className={classNames(
                                    "absolute top-1 overflow-y-scroll rounded bg-white border border-gray-200",
                                    "shadow-md w-full max-w-[16rem] z-10 divide-y",
                                  )}>
                                    <Listbox.Option value="blacklist" as="button" type="button" className="px-3 py-2 block w-full text-left text-sm hover:bg-gray-50">
                                      { localize(lang, "room_permission_type_blacklist") }
                                    </Listbox.Option>
                                    <Listbox.Option value="whitelist" as="button" type="button" className="px-3 py-2 block w-full text-left text-sm hover:bg-gray-50">
                                      { localize(lang, "room_permission_type_whitelist") }
                                    </Listbox.Option>
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </Listbox>

                          </dd>
                        </div>
                      </dl>
                    </section>
                    <section className="my-12 sm:mx-12">
                      <h1 className="font-bold text-sm my-4">{ localize(lang, "stream-setting") }</h1>
                      <dl className="divide-y divide-gray-100">
                        <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900 py-0.5">
                            { localize(lang, "stream-control") }
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                            {
                              selectedRoomDetail.status === 'streaming' ?
                                <button
                                  onClick={() => turnOffStream(selectedRoomDetail.id)}
                                  className={classNames(
                                    "px-4 rounded text-blue-600 font-bold py-1 text-sm",
                                    "flex flex-row items-center space-x-2 border border-blue-600",
                                    "focus:ring-blue-200 focus:ring transtion duration-200",
                                    "hover:bg-blue-600 hover:text-white",
                                  )}>
                                  <XMarkIcon className="h-4 w-4"/>
                                  <span>{ localize(lang, "stop_streaming_btn") }</span>
                                </button>
                                :
                                <button
                                  onClick={() => turnOnStream(selectedRoomDetail.id)}
                                  className={classNames(
                                    "px-4 rounded text-blue-600 font-bold py-1 text-sm",
                                    "flex flex-row items-center space-x-2 border border-blue-600",
                                    "focus:ring-blue-200 focus:ring transtion duration-200",
                                    "hover:bg-blue-600 hover:text-white hover:shadow",
                                  )}>
                                  <PlayCircleIcon className="h-4 w-4"/>
                                  <span>{ localize(lang, "start_streaming_btn") }</span>
                                </button>
                            }
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900">
                            { localize(lang, "stream-server") }
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0 code select-all">
                            {`rtmp://${ location.host.replace(/:\d+$/, '') }:1935/live`}
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium leading-6 text-gray-900">
                            { localize(lang, "stream-key") }
                          </dt>
                          <dd className={classNames(
                            "mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0",
                            "whitespace-nowrap overflow-x-auto",
                            roomStreamKey ? "select-all code" : ""
                          )}>
                            { roomStreamKey ? roomStreamKey : 
                              selectedRoomDetail.status === 'streaming' ?
                                localize(lang, 'stream-key-hidden')
                                :
                                localize(lang, "stream-only-visible-to-streaming-configuration")
                            }
                          </dd>
                        </div>
                      </dl>
                    </section>
                    <section className="my-12 sm:mx-12">
                      <h1 className="font-bold text-sm my-4">{ localize(lang, "permission-items") }</h1>
                      <ul role="list" className="flex flex-wrap space-x-1">
                        { selectedRoomDetail.permission_items.length === 0 ?
                          <span className="text-sm"> { localize(lang, "no_data") } </span>
                          :
                          <></>
                        }
                        {selectedRoomDetail.permission_items.map((item) => (
                          <li key={`${item.type}-${item.label}-${item.user_id}`} className="my-1 flex space-x-2 items-center py-2 px-3 rounded-lg border-2 border-gray-300 border-dashed">
                            { item.type === 'label' ?
                              <div className="h-5 w-5 p-1 rounded-full bg-yellow-500 text-white flex-shrink-0">
                                <TagIcon />
                              </div>
                              :
                              <div className="h-5 w-5 p-1 rounded-full bg-blue-500 text-white flex-shrink-0">
                                <UserIcon />
                              </div>
                            }
                            <div className="text-sm">
                              { item.username ? item.username : item.label }
                            </div>
                            <button
                              className="h-4 w-4 rounded-full hover:bg-red-500 hover:text-white trantision duration-200"
                              onClick={() => handlePermItemDelete(item.type, (item.username || item.label)!)}>
                              <XMarkIcon />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <form className="flex items-stretch">
                        <Listbox name="type" defaultValue="label">
                          <Listbox.Button className="relative px-2 py-2 rounded-l-lg border border-gray-300 flex items-center space-x-2">
                            {({ value }) => (
                              <>
                                { value == 'label' ?
                                  <div className="h-5 w-5 p-1 rounded-full bg-yellow-500 text-white flex-shrink-0">
                                    <TagIcon />
                                  </div>
                                  :
                                  <div className="h-5 w-5 p-1 rounded-full bg-blue-500 text-white flex-shrink-0">
                                    <UserIcon />
                                  </div>
                                }
                                <ChevronUpDownIcon className="h-4 w-4"/>
                              </>
                            )}
                          </Listbox.Button>

                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Listbox.Options className="absolute top-[calc(2.5rem+1px)] -left-16 w-32 bg-white border shadow rounded text-sm text-gray-900 flex flex-col">
                              <Listbox.Option as="button" type="button" value="label" className="px-3 py-2 flex flex space-x-4 hover:bg-gray-50">
                                <div className="h-5 w-5 p-1 rounded-full bg-yellow-500 text-white flex-shrink-0">
                                  <TagIcon />
                                </div>
                                <span>Label</span>
                              </Listbox.Option>

                              <Listbox.Option as="button" type="button" value="user" className="px-3 py-2 flex flex space-x-4 hover:bg-gray-50">
                                <div className="h-5 w-5 p-1 rounded-full bg-blue-500 text-white flex-shrink-0">
                                  <UserIcon />
                                </div>
                                <span>User</span>
                              </Listbox.Option>
                            </Listbox.Options>
                          </Transition>
                        </Listbox>
                        <input
                          type="input"
                          name="subject"
                          className="p-2 w-64 border border-l-0 border-gray-300 focus:ring focus:ring-blue-500 focus:outline-none relative focus:z-10 text-sm"
                        />
                        <button type='submit' className="px-3 bg-blue-600 rounded-r text-white flex items-center space-x-2 text-sm focus:ring focus:ring-blue-200 focus:z-10">
                          <PlusIcon className="h-4 w-4"/>
                          <span> { localize(lang, "add") }</span>
                        </button>
                      </form>
                    </section>
                  </>
                  :
                  <SelectRoomFirstHint />
                }
              </div>
            }
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
