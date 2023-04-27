import { Nav } from "@/components/Nav/Nav";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { dashboardNavs } from "@/constants/navs"
import { MagnifyingGlassIcon,
  KeyIcon,
  ArrowPathRoundedSquareIcon, 
  TagIcon,
  FireIcon,
  QueueListIcon,
  UserCircleIcon,
  AcademicCapIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import { localize, localizeError } from "@/i18n/i18n";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button/Button";
import { Footer } from "@/components/Footer/Footer";
import { Role, AdminListAccountsResponse } from "@/api/v1/datatypes";
import { classNames } from "@/utils/classnames";
import { JetBrains_Mono } from "next/font/google";
import Pagination from "@/components/Pagination/Pagination";
import debounce from "@/utils/debounce";
import { createNewAccounts, fetchAccounts, fetchRoles } from "@/api/v1/admin/account";
import Dialog from "@/components/Dialog/Dialog";
import { TitleContext } from "@/contexts/TitleContext";

const presetRoles = [
  { name: "all", indicator_class: "bg-blue-500" },
  { name: "administrator", indicator_class: "bg-red-500" },
  { name: "user", indicator_class: "bg-gray-500" },
]

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
})

export default function RoomIndex() {
  const router = useRouter()
  const lang = router.locale!

  const { authenticated,    getUser             } = useContext(AuthContext)
  const [ errCode,          setErrCode          ] = useState<number | null>()
  const [ httpErrCode,      setHttpErrCode      ] = useState<number | null>()

  const [accounts,  setAccounts ] = useState<AdminListAccountsResponse | null>(null)

  const [roles,            setRoles           ] = useState<Role[] | null>(null)
  const [userFilterRole,   setUserFilterRole  ] = useState<'all' | 'administrator' | 'user'>('all')
  const [search,           setSearch          ] = useState<string | undefined>()
  const [page,             setPage            ] = useState<number>(1)
  const [maxPage,          setMaxPage         ] = useState<number>(1)

  const newUserFormUsernameRef   = useRef<HTMLInputElement>(null)
  const newUserFormPasswordRef   = useRef<HTMLInputElement>(null)
  const newUserFormLabelInputRef = useRef<HTMLInputElement>(null)
  const [newUserFormRole,     setNewUserFormRole    ] = useState<string>("user")
  const [newUserFormLabels,   setNewUserFormLabels  ] = useState<string[]>([])

  const [newUserFormLoading,   setNewUserFormLoading  ] = useState<boolean>(false)
  const [newUserFormErrorCode, setNewUserFormErrorCode] = useState<number| null>(null)

  const searchRef = useRef<HTMLInputElement | null>(null)

  const [newUserDialogOpen, setNewUserDialogOpen] = useState<boolean>(false)

  const { setTitle } = useContext(TitleContext)
  useEffect(() => {
    setTitle(["dashboard", "users_page"].map((v) => localize(lang, v)))
  }, [])

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

  const refreshStats = useCallback((search: string | undefined, role: 'administrator' | 'user' | 'all', page: number) => {
    const roleFilter = role === "all" ? undefined : role
    fetchAccounts({ search, role: roleFilter, limit: 10, page})
      .then(accounts => {
        setAccounts(accounts)
        setMaxPage(Math.ceil(accounts.total / 10))
      })
      .catch(dealWithFetchError)

    fetchRoles()
      .then(response => setRoles(response.roles))
      .catch(dealWithFetchError)
  }, [setRoles])

  useEffect(() => {
    refreshStats(search, userFilterRole, page)
  }, [refreshStats, userFilterRole, search, page])

  const handleNewUserFormLabelAppend = () => {
    if(!newUserFormLabelInputRef.current || newUserFormLabelInputRef.current.value === '') return

    let value = newUserFormLabelInputRef.current.value
    value = value.trim()
    value = value.replaceAll(/\s+/g, '-')

    if(newUserFormLabels.indexOf(value) != -1) return

    setNewUserFormLabels(c => [...c, value])
  };

  const handleNewUserFormLabelDelete = (label: string) => {
    setNewUserFormLabels(c => c.filter(l => l != label))
  };

  const handleNewUserFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      username: newUserFormUsernameRef.current!.value,
      password: newUserFormPasswordRef.current!.value,
      role: newUserFormRole,
      labels: newUserFormLabels
    }
    setNewUserFormLoading(true)

    createNewAccounts([payload]) 
      .then((data) => {
        setNewUserFormErrorCode(data.code)
        newUserFormLabelInputRef.current!.value = ''
        newUserFormPasswordRef.current!.value = ''
      })
      .catch(e => {
        setNewUserFormErrorCode(e.response?.data!.code)
      })
      .finally(() => {
        setNewUserFormLoading(false)
      })
  };

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
              { localize(lang, "users_page") }
            </h1>
            <button
              className="ml-1 p-1 rounded-full focus:outline-none focus:ring focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              onClick={() => refreshStats(search, userFilterRole, page)}
            >
              <ArrowPathRoundedSquareIcon className="h-4 w-4 text-gray-400"/>
            </button>
          </div>
          <div className="shadow rounded-lg bg-white p-5 flex flex-col space-y-4">
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
                  <Listbox value={userFilterRole} onChange={(v) => { setUserFilterRole(v); setPage(1) }}>
                    <Listbox.Button className="h-full w-full md:w-48 relative py pr-2 pl-4 shadow-sm rounded border border-gray-200 flex items-center justify-between focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-200 transition duration-100">
                      <span className="truncate flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${presetRoles.find((v) => v.name == userFilterRole)!.indicator_class}`} />
                        <span className="text-left text-sm text-gray-600"> { localize(lang, `user_filter_role_${userFilterRole}`) } </span>
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
                        {presetRoles.map((v) => (
                          <Listbox.Option
                            key={v.name}
                            value={v.name}
                            className={({ active }) => `h-8 w-full truncate px-4 py-1 ${active ? "bg-gray-100 text-black" : "" } ${userFilterRole === v.name ? "font-bold" : "font-normal"}`}
                          >
                            <button className="flex items-center space-x-2 w-full">
                              <span className={`h-2 w-2 rounded-full ${v.indicator_class}`}/>
                              <span className="text-left text-gray-600"> { localize(lang, `user_filter_role_${v.name}`) } </span>
                            </button>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </Listbox>
                </div>
              </div>
              <button className={ classNames(
                "h-full pl-2 pr-3 py-1",
                "rounded bg-blue-600 border border-blue-600 text-white font-medium text-sm flex-shrink-0",
                "flex items-center space-x-2 focus:outline-none focus:ring focus:ring-blue-300 transition duration-200",
                "shadow-sm"
              )}
                onClick={() => setNewUserDialogOpen(true)}>
                <PlusIcon className="h-5 w-5 inline-block"/>
                <span> { localize(lang, "new_user_btn") } </span>
              </button>
              <Dialog open={newUserDialogOpen} onClose={() => setNewUserDialogOpen(false)}>
                <form onSubmit={handleNewUserFormSubmit}>
                  <div className="space-y-2 p-5">
                    <h2 className="text-lg font-bold pb-2"> { localize(lang, "new_user_btn") } </h2>
                    <section className="space-y-1">
                      <label htmlFor="username-input" className="block text-sm font-medium text-gray-700"> { localize(lang, "username") } </label>
                      <input
                        required
                        ref={newUserFormUsernameRef}
                        type="text"
                        autoComplete="username"
                        id="username-input"
                        className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:ring focus:ring-offset-0 focus:ring-blue-500 sm:text-sm transition ease duration-200"
                      />
                    </section>
                    <section className="space-y-1">
                      <label htmlFor="password-input" className="block text-sm font-medium text-gray-700"> 
                        { localize(lang, "password") }
                      </label>
                      <input
                        required
                        ref={newUserFormPasswordRef}
                        autoComplete="new-password"
                        id="password-input"
                        type="password"
                        minLength={8}
                        maxLength={64}
                        pattern={`[0-9a-zA-Z_-~!@#$%^&*()_+=\`\\[\\]{}\|;:'",.<>\/\\?]{8,64}`}
                        title={localize(lang, "password_format_hint")}
                        className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:ring focus:ring-blue-500 sm:text-sm transition ease duration-200"
                      />
                    </section>
                    <section className="space-y-1">
                      <label htmlFor="role-selection" className="block text-sm font-medium text-gray-700"> { localize(lang, "role") } </label>
                      <Listbox id="role-selection" as="div" value={newUserFormRole} onChange={setNewUserFormRole}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-left flex items-center justify-between shadow-sm text-md">
                            <span>
                              <span className="code">{ newUserFormRole }</span>
                              { localize(lang, `user_filter_role_${newUserFormRole}`) ?
                                <span className="mx-1 px-2 text-xs bg-gray-100">{ localize(lang, `user_filter_role_${newUserFormRole}`) }</span>
                                :
                                <></>
                              }
                            </span>
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-500"/>
                          </Listbox.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Listbox.Options className="absolute top-1 overflow-y-scroll rounded bg-white border border-gray-200 shadow-md w-full z-10 divide-y">
                              { roles?.map((role) => (
                                <Listbox.Option key={role.name} value={role.name} as="button" type="button" className="px-3 py-2 block w-full text-left text-sm">
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
                    </section>
                    <section className="space-y-2">
                      <label htmlFor="label-input" className="block text-sm font-medium text-gray-700"> { localize(lang, "user_labels") } </label>
                      <div role="list" className="flex flex-wrap flex-row items-center gap-2">
                        { newUserFormLabels.map((label) => 
                          <span key={label} className="pl-2 pr-1 bg-blue-500 text-sm text-white">
                            { label }
                            <button type="button" onClick={() => handleNewUserFormLabelDelete(label)}>
                              <XMarkIcon className="h-3 w-3 mx-1" />
                            </button>
                          </span>
                        )}
                        { newUserFormLabels.length === 0 ?
                          <span className="text-sm"> { localize(lang, "account_have_no_label") } </span>
                          :
                          <></>
                        }
                      </div>
                      <div className="flex flex-row items-center">
                        <input
                          autoComplete="user-label"
                          type="text"
                          ref={newUserFormLabelInputRef}
                          placeholder="Add labels"
                          className={classNames(
                            "block w-full appearance-none rounded border border-gray-300 px-2 py-1 placeholder-gray-400 shadow-sm",
                            "focus:ring focus:ring-blue-500 sm:text-sm transition ease duration-200",
                            "flex-shrink-1",
                          )}
                        />
                        <button
                          type="button"
                          className={classNames(
                          "rounded bg-white border border-gray-200 pl-3 pr-4 py-1 mx-2 shadow-sm text-sm flex items-center space-x-2",
                          "focus:outline-none focus:ring focus:ring-blue-500 transition duration-200",
                          "flex-shrink-0",
                        )}
                          onClick={() => handleNewUserFormLabelAppend()}
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>{ localize(lang, "add_label_btn") }</span>
                        </button>
                      </div>
                    </section>
                  </div>
                  <section className="flex flex-row items-center justify-between p-4 bg-gray-100">
                    <span className={classNames(
                      newUserFormErrorCode !== 0 ? 'text-red-500' : 'text-green-600',
                      'text-sm font-medium'
                    )}>
                      { /* newUserFormError === null represents there's no message */ }
                      { newUserFormErrorCode === 0 ?
                        localize(lang, "create_user_success")
                        : 
                        newUserFormErrorCode !== null ? localizeError(lang, newUserFormErrorCode) : ""
                      }
                    </span>
                    <div className="flex items-center space-x-4">
                      <Button type="secondary" onClick={() => setNewUserDialogOpen(false)}>{ localize(lang, "cancel") }</Button>
                      <Button type="primary" submit disabled={newUserFormLoading}>
                        { newUserFormLoading ?
                          <svg className="animate-spin inline-block mx-2 -mt-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          :
                          <></>
                        }
                        <span>{ localize(lang, "create") }</span>
                      </Button>
                    </div>
                  </section>
                </form>
              </Dialog>
            </div>
            <div className="w-full h-full overflow-x-auto">
              <table className="w-full">
                <thead className="text-gray-500 text-xs border-b bg-gray-50">
                  <tr className="uppercase whitespace-nowrap text-left">
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <UserCircleIcon className="h-4 w-4"/>
                        <span> { localize(lang, 'username') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <KeyIcon className="h-4 w-4" />
                        <span> { localize(lang, 'user_id') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <TagIcon className="h-4 w-4" />
                        <span> { localize(lang, 'user_labels') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <QueueListIcon className="h-4 w-4" />
                        <span> { localize(lang, 'user_max_rooms') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <FireIcon className="h-4 w-4" />
                        <span> { localize(lang, 'user_rooms') } </span>
                      </span>
                    </th>
                    <th className="py-4">
                      <span className="flex items-center space-x-1">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span> { localize(lang, 'user_role') } </span>
                      </span>
                    </th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  { accounts?.users.map((account) =>
                    <tr key={account.id} className="whitespace-nowrap text-left">
                      <th>{ account.username }</th>
                      <th className="code">{ account.id }</th>
                      <th>{ account.labels.length === 0 ?
                        <span className="text-xs"> { localize(lang, "account_have_no_label") } </span>
                        :
                        account.labels.map(label => 
                          <span key={label} className="mx-1 px-1 bg-blue-500 text-white text-xs">{ label }</span>
                        )
                      }</th>
                      <th className="font-numeric">{ account.max_rooms }</th>
                      <th className="font-numeric">{ account.owned_rooms }</th>
                      <th>
                        <span className="flex flex-row items-center space-x-2">
                          { account.role === "administrator" ?
                            <span className="relative h-2 w-2 rounded-full bg-red-500 inline-block" />
                            :
                            <span className="relative h-2 w-2 mr-0.5 rounded-full bg-gray-500 inline-block" />
                          }
                          <span> { localize(lang, `user_filter_role_${account.role}`) } </span>
                        </span>
                      </th>
                      <th>
                        <Button type="link" href={`/dashboard/users/${account.username}`}>
                          { localize(lang, "edit") }
                        </Button>
                      </th>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            { accounts?.users.length === 0 ?
              <div className="py-16 px-8 w-full h-full flex flex-col items-center justify-around space-y-2">
                <span className="text-8xl">😅</span>
                <span className="text-center w-full text-sm text-gray-600">{ localize(lang, "no_data") }</span>
              </div>
              :
              <></>
            }
            <div className="flex flex-row items-center justify-between mt-2 px-2">
              <span className="text-sm text-gray-500">
                { localize(lang, "total") } { accounts?.total }
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
