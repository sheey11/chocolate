import { localize } from "@/i18n/i18n"
import Link from "next/link"
import { useRouter } from "next/router"

import { Fragment, useContext } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Contrail_One } from "next/font/google"
import { AuthContext } from "@/contexts/AuthContext"
import { ArrowSmallRightIcon } from "@heroicons/react/24/solid"
import { profileNavs } from "@/constants/navs"

const sail = Contrail_One({
    weight: "400",
    subsets: ['latin'],
})

interface Navigation {
    i18n_key: string,
    href: string,
}
interface Navigations extends Array<Navigation> {}

const defaultAvatar = "/avatar.jpg"

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

interface NavProps {
    navs: Navigations
}

export const Nav = ({ navs }: NavProps) => {
    const router = useRouter()
    const { pathname } = router
    const lang = router.locale!

    const { authenticated, getUser, signout } = useContext(AuthContext)

    const userNavigation = [
        { name: localize(lang, "your_profile"), handler: () => { router.push('#') } },
        { name: localize(lang, "settings"),     handler: () => { router.push('#') } },
        { name: localize(lang, "sign_out"),     handler: () => {
            signout()
            router.push('/')
        }},
    ]

    const selected = [...navs, ...profileNavs].map((item) => pathname.startsWith(item.href))

    return (
        <Disclosure as="header" className="bg-white shadow-sm">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:divide-y lg:divide-gray-200 lg:px-8">
                        <div className="relative flex h-16 justify-between">
                            <div className="relative z-10 flex px-2 lg:px-0">
                                <Link className="flex flex-shrink-0 items-center" href="/">
                                    <img
                                        className="block h-8 w-auto"
                                        src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600"
                                        alt="Chocolate"
                                    />
                                    <span className={`px-2 text-xl pt-1 ${sail.className}`}>
                                        Chocolate
                                    </span>
                                </Link>
                            </div>
                            <div className="relative z-10 flex items-center lg:hidden">
                                {/* Mobile menu button */}
                                <Disclosure.Button
                                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring focus:ring-blue-500 transition duration-100"
                                >
                                    <span className="sr-only">Open menu</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                        )}
                                </Disclosure.Button>
                            </div>
                            <div className="hidden lg:relative lg:ml-4 lg:flex lg:items-center">
                                { authenticated ?
                                    <>
                                        <button
                                            type="button"
                                            className="flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                                        >
                                            <span className="sr-only">View notifications</span>
                                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>

                                        {/* Profile dropdown */}
                                        <Menu as="div" className="relative ml-4 flex-shrink-0">
                                            <div>
                                                <Menu.Button className="flex rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
                                                    <span className="sr-only">Open user menu</span>
                                                    <img className="h-8 w-8 rounded-full" src={ defaultAvatar } alt="" />
                                                </Menu.Button>
                                            </div>
                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {userNavigation.map((item) => (
                                                        <Menu.Item key={item.name}>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={item.handler}
                                                                    className={classNames(
                                                                        active ? 'bg-gray-100' : '',
                                                                        'w-full text-left block py-2 px-4 text-sm text-gray-700'
                                                                    )}
                                                                >
                                                                    {item.name}
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    ))}
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
                                    </>
                                    :
                                    <>
                                        <Link href="/signin" className="text-sm font-bold text-gray-800 flex items-center">
                                            <span>{ localize(lang, "signin") }</span>
                                            <ArrowSmallRightIcon className="h-4 w-4"/>
                                        </Link>
                                    </>
                                }
                            </div>
                        </div>
                        <nav className="hidden lg:flex lg:justify-between lg:pt-2" aria-label="Global">
                            <div className="flex space-x-4">
                                {navs.map(item => (
                                    <Link
                                        key={ item.i18n_key }
                                        href={ item.href }
                                        className={classNames(
                                            pathname.startsWith(item.href) ? 'text-gray-900 border-blue-500' : 'border-transparent text-gray-500 text-black-900 hover:border-gray-200',
                                            'py-2 px-3 inline-flex items-center text-sm font-medium border-b-2 transition duraion-100'
                                        )}
                                        aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                                    >
                                        { localize(lang, item.i18n_key) }
                                    </Link>
                                ))}
                            </div>
                            <div className="flex space-x-4">
                                {profileNavs.map(item => (
                                    <Link
                                        key={ item.i18n_key }
                                        href={ item.href }
                                        className={classNames(
                                            pathname.startsWith(item.href) ? 'text-gray-900 border-blue-500' : 'border-transparent text-gray-500 text-black-900 hover:border-gray-200',
                                            'py-2 px-3 inline-flex items-center text-sm font-medium border-b-2 transition duraion-100'
                                        )}
                                        aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                                    >
                                        { localize(lang, item.i18n_key) }
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>

                    <Disclosure.Panel as="nav" className="lg:hidden" aria-label="Global">
                        <div className="space-y-1 px-2 pt-2 pb-3">
                            { navs.map((item) => (
                                <Disclosure.Button
                                    key={ item.i18n_key }
                                    as="div"
                                    className={classNames(
                                        pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
                                        'block rounded-md text-base font-medium'
                                    )}
                                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                                >
                                    <Link className="block py-2 px-3" href={ item.href }>
                                        { localize(lang, item.i18n_key) }
                                    </Link>
                                </Disclosure.Button>
                            ))}
                            { profileNavs.map((item) => (
                                <Disclosure.Button
                                    key={ item.i18n_key }
                                    as="div"
                                    className={classNames(
                                        pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
                                        'block rounded-md text-base font-medium'
                                    )}
                                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                                >
                                    <Link className="block py-2 px-3" href={ item.href }>
                                        { localize(lang, item.i18n_key) }
                                    </Link>
                                </Disclosure.Button>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 pt-4 pb-3">
                            { authenticated ?
                                <>
                                    <div className="flex items-center px-4">
                                        <div className="flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full" src={ defaultAvatar } alt="" />
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-gray-800">{getUser()?.username}</div>
                                            <div className="text-sm font-medium text-gray-500 capitalize">{getUser()?.role}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="ml-auto flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <span className="sr-only">View notifications</span>
                                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-1 px-2">
                                        {userNavigation.map((item) => (
                                            <Disclosure.Button
                                                key={item.name}
                                                as="div"
                                                className="block rounded-md text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            >
                                                <button className="w-full text-left block py-2 px-3" onClick={item.handler}>
                                                    {item.name}
                                                </button>
                                            </Disclosure.Button>
                                        ))}
                                    </div>
                                </>
                                :
                                <Disclosure.Button
                                    as="div"
                                    className="mx-2 block rounded-md text-base font-bold text-gray-900 hover:bg-gray-50">
                                    <Link className="block py-2 px-3" href="/signin">
                                        { localize(lang, "signin") }
                                    </Link>
                                </Disclosure.Button>
                            }
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
}
