import { Nav } from "@/components/Nav/Nav"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/router"
import { ChangeEvent, FormEvent, FormEventHandler, Fragment, useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { dashboardNavs } from "@/constants/navs"
import { Inter, JetBrains_Mono } from "next/font/google"
import Button from "@/components/Button/Button"
import { useState } from 'react'
import {  PlusIcon, TagIcon, } from '@heroicons/react/24/solid'
import { ArrowPathRoundedSquareIcon, ChevronUpDownIcon, TrashIcon, UserIcon, XMarkIcon, } from '@heroicons/react/24/outline'
import { Footer } from "@/components/Footer/Footer"
import { localize, localizeError } from "@/i18n/i18n"
import Dialog from "@/components/Dialog/Dialog"
import { AdminAccountDetail, Role, ChocolcateResponse } from "@/api/v1/datatypes"
import "humanizer.node"
import { deleteAccount, fetchAccountDetail, addAccountLabel, fetchRoles, updateAccountMaxRoom, updateAccountRole, deleteAccountLabel, updateAccountPassword } from "@/api/v1/admin/account"
import debounce from "@/utils/debounce"
import { classNames } from "@/utils/classnames"
import AccountHistory from "@/components/AccountHistory/AccountHistory"
import { Listbox, Transition } from "@headlessui/react"
import MessageQueue, { MessageQueueHandle } from "@/components/MessageQueue/MessageQueue"
import { AxiosError } from "axios"
import { TitleContext } from "@/contexts/TitleContext"

const colorPattles = [
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

export default function RoomDetailPage() {
  const router = useRouter()
  const username = router.query.username as string | undefined
  const lang = router.locale!

  const mqRef      = useRef<MessageQueueHandle | null>(null)
  const maxRoomRef = useRef<HTMLInputElement   | null>(null)
  const labelRef   = useRef<HTMLInputElement   | null>(null)
  const passwordRef = useRef<HTMLInputElement  | null>(null)

  const [roles,            setRoles           ] = useState<Role[] | null>(null)

  const [deleteConfirmDialogOpen,      setDeleteConfirmDialogOpen     ] = useState(false)
  const [accountDetail,                setAccountDetail               ] = useState<AdminAccountDetail     | null>(null)
  const [accountRoleSelectionValue,    setAccountRoleSelectionValue   ] = useState<string                 | null>(null)

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const { setTitle } = useContext(TitleContext)
  useEffect(() => {
    setTitle(["dashboard", "users_page"].map((v) => localize(lang, v)))
  }, [])

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

  const showErrorMessage = (e: AxiosError<ChocolcateResponse>) => {
    console.error(e)
    mqRef.current?.error(localizeError(lang, e.response?.data!.code), localize(lang, "error_occurred"))
  }

  const showSuccessMessage = (content?: string, title?: string) => {
    if (!content) content = localize(lang, "successfully_saved")
    if (!title)   title   = localize(lang, "success")
    mqRef.current?.success(content, title, true)
  }

  const reloadDetail = useCallback((username: string | undefined) => {
    if(!username) return
    fetchAccountDetail(username)
      .then(r => {
        setAccountDetail(r.user_info)
        setAccountRoleSelectionValue(r.user_info.role)
        if(maxRoomRef.current != null){
          maxRoomRef.current.value = r.user_info.max_rooms.toString()
        }
      })
      .catch(dealWithFetchError)
  }, [])

  useEffect(() => {
    if (!username) return
    reloadDetail(username)
  }, [username, reloadDetail])

  useEffect(() => {
    fetchRoles()
      .then(r => setRoles(r.roles))
      .catch(dealWithFetchError)
  }, [])

  const handleUserRoleChange = (role: string | undefined) => {
    if(!role || !username) return
    updateAccountRole(username, role)
      .then(() => { 
        setAccountRoleSelectionValue(role)
        showSuccessMessage(localize(lang, "updated"))
        reloadDetail(username)
      })
      .catch(showErrorMessage)
  }

  const handleDelete = useCallback(() => {
    if(!username) return
    deleteAccount(username)
      .then(() => router.push("/dashboard/users"))
      .catch(dealWithFetchError)
  }, [username, router])

  const handleMaxRoomChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    if (!username) return

    const value = parseInt(e.target.value)
    if (!value || value < 0 || value > 50) return

    updateAccountMaxRoom(username, value)
      .then(() => {
        showSuccessMessage()
      })
      .catch(showErrorMessage)
  }, 500)

  const addNewLabel = () => {
    if (!username || !labelRef.current) return
    const label = labelRef.current.value.replaceAll(/\s+/g, "-")
    addAccountLabel(username, label)
      .then(() => {
        showSuccessMessage()
        reloadDetail(username)
      })
      .catch(showErrorMessage)
  }

  const handleLabelDelete = (label: string) => {
    if (!username) return
    deleteAccountLabel(username, label)
      .then(() => {
        showSuccessMessage()
        reloadDetail(username)
      })
      .catch(showErrorMessage)
  }

  const handleAccountPasswordModification = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!username) return
    if(!passwordRef.current) return
    const password = passwordRef.current.value

    updateAccountPassword(username, password)
      .then(() => {
        showSuccessMessage(localize(lang, "updated"))
        if(passwordRef.current) passwordRef.current.value = ""
      })
      .catch(showErrorMessage)
  }

  if(!authenticated || getUser()?.role != "administrator") {
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
          <h1 className="text-7xl font-jbm">{ 403 }</h1>
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
      <MessageQueue ref={mqRef} />
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
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 grid-cols-2">
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-gray-900 code">{ accountDetail?.id }</dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{ localize(lang, "username") }</dt>
                  <dd className="mt-1 text-md text-gray-900 overflow-x-auto code">
                    { accountDetail?.username }
                  </dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">{ localize(lang, "user_role") }</dt>
                  <dd className="mt-1 text-sm text-gray-900 transition duration-100">
                    <Listbox id="role-selection" as="div" value={accountRoleSelectionValue} onChange={handleUserRoleChange}>
                      <div className="relative">
                        <Listbox.Button className={classNames(
                          "w-full max-w-[16rem] py-1",
                          "border border-white/0 hover:border-gray-300 hover:shadow-sm hover:px-2 hover-show",
                          "rounded text-sm text-left flex items-center justify-between text-md",
                          "transition-all duration-200",
                        )}>
                          <span>
                            <span className="code">{ accountRoleSelectionValue }</span>
                            { localize(lang, `user_filter_role_${ accountRoleSelectionValue }`) ?
                              <span className="mx-1 px-2 text-xs bg-gray-100">{ localize(lang, `user_filter_role_${ accountRoleSelectionValue }`) }</span>
                              :
                              <></>
                            }
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
                            { roles?.map((role) => (
                              <Listbox.Option key={role.name} value={role.name} as="button" type="button" className="px-3 py-2 block w-full text-left text-sm hover:bg-gray-50">
                                <span className="code">{ role.name }</span>
                                { localize(lang, `user_filter_role_${role.name}`) ?
                                  <span className="ml-2 px-2 text-xs bg-gray-100">{ localize(lang, `user_filter_role_${role.name}`) }</span>
                                  :
                                  <></>
                                }
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                    <span> { localize(lang, "user_max_rooms") } </span>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 transition duration-100">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      ref={maxRoomRef}
                      onChange={handleMaxRoomChange}
                      className={classNames(
                        "max-w-full w-32 text-sm px-0",
                        "transition-all duraion-200 rounded py-1 hover:px-2 focus:px-2",
                        "border border-white/0 hover:border-gray-300 focus:border-gray-300",
                        "hover:shadow focus:shadow",
                        "focus:outline-none focus:ring focus:ring-blue-500",
                      )}/>
                  </dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                    <span> { localize(lang, "account-password") } </span>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 transition duration-100">
                    <form onSubmit={handleAccountPasswordModification}>
                      <input
                        type="text"
                        ref={passwordRef}
                        autoComplete="new-password"
                        required
                        placeholder={ localize(lang, "password-click-to-modify-placeholder") }
                        onFocus={() => {
                          if (passwordRef.current)
                          passwordRef.current.placeholder = localize(lang, "password-enter-to-save")
                        }}
                        onBlur={() => {
                          if (passwordRef.current)
                          passwordRef.current.placeholder = localize(lang,  "password-click-to-modify-placeholder")
                        }}
                        minLength={8}
                        maxLength={64}
                        pattern={`[0-9a-zA-Z_-~!@#$%^&*()_+=\`\\[\\]{}\|;:'",.<>\/\\?]{8,64}`}
                        title={localize(lang, "password_format_hint")}
                        className={classNames(
                          "placeholder:text-gray-400",
                          "max-w-full w-64 text-sm px-0",
                          "transition-all duraion-200 rounded py-1 hover:px-2 focus:px-2",
                          "border border-white/0 hover:border-gray-300 focus:border-gray-300",
                          "hover:shadow focus:shadow",
                          "focus:outline-none focus:ring focus:ring-blue-500",
                        )}/>
                    </form>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium flex items-center space-x-1 text-gray-500">
                    <span> { localize(lang, "user_labels") } </span>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 transition duration-100">
                    <ul role="list" className="flex flex-wrap space-x-1">
                      {accountDetail?.labels.map((label) => (
                        <li key={label} className="my-1 flex space-x-2 items-center py-2 px-3 rounded-lg border-2 border-gray-300 border-dashed">
                          <div className="h-5 w-5 p-1 rounded-full bg-yellow-500 text-white flex-shrink-0">
                            <TagIcon />
                          </div>
                          <div className="text-sm">
                            { label }
                          </div>
                          <button
                            className="h-4 w-4 rounded-full hover:bg-red-500 hover:text-white trantision duration-200"
                            onClick={() => handleLabelDelete(label)}>
                            <XMarkIcon />
                          </button>
                        </li>
                      ))}
                      <li className="my-1 flex space-x-2 items-center py-2 px-3 rounded-lg border-2 border-gray-300 border-dashed">
                        <div className="h-5 w-5 p-1 rounded-full bg-blue-500 text-white flex-shrink-0">
                          <PlusIcon />
                        </div>
                        <input
                          placeholder={ localize(lang, "add_label_prompt") }
                          type="input"
                          ref={labelRef}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addNewLabel()
                            }
                          }}
                          className={classNames(
                            "rounded text-sm",
                            "px-1 focus:px-2 transition-all duration-200 w-20 focus:w-32",
                            "border border-white/0 hover:border-gray-300 focus:border-gray-300",
                            "outline-blue-500"
                          )}
                        />
                      </li>
                    </ul>
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
                </div>
              }
            </div>
          </div>
        </section>

        <section aria-labelledby="history-title">
          <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
            <h2 id="history-title" className="text-lg font-medium text-gray-900">
              {  localize(lang, "account_history") }
            </h2>

            {/* history */}
            <AccountHistory username={username} onError={dealWithFetchError}/>
          </div>
        </section>
      </main>
      <Footer/>
    </>
  )
}
