import { Listbox, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { useRouter } from "next/router"
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { languages } from './language-specifications'

interface LSProps {
    outline?: boolean
}

export const LanguageSwitcher = ({ outline }: LSProps) => {
    const router = useRouter()
    const { pathname, query } = router
    const { locale, locales } = router

    const handleSelect = (lang: string) => {
        router.push({ pathname, query}, router.asPath, { locale: lang })
    }

    return (
        <>
            <Listbox value={ locale } onChange={ handleSelect }>
                <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-pointer rounded bg-white border border-gray-300 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring focus:ring-blue-300 transition duratin-200 sm:text-sm">
                        <span className="block truncate">{languages[locale!].icon} {languages[locale!].name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        enter="transision transform ease-out duration-100"
                        enterFrom="opacity-0 scale-90"
                        enterTo="opacity-100 scale-100"
                        leave="transition transform ease-out duration-80"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-90"
                    >
                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded bg-white border border-gray-200 text-base shadow-lg focus:outline-none focus:ring-blue-200 sm:text-sm">
                            {locales!.map((localeName, idx) => (
                                <Listbox.Option
                                    key={idx}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${ active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900' }`
                                    }
                                    value={localeName}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={`inline-block truncate ml-2 ${ selected ? 'font-medium' : 'font-normal' }`}>
                                                { languages[localeName].icon + " " + languages[localeName].name }
                                            </span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </>
    )
}
