import { Listbox, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { useRouter } from "next/router"
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { languages } from './language-specifications'
import { Noto_Color_Emoji } from "next/font/google"

const notoEmoji = Noto_Color_Emoji({
    weight: "400",
    subsets: ['emoji'],
})

interface LSProps {
    outline?: boolean
    position?: "bottom" | "top", 
    background?: boolean
}

export const LanguageSwitcher = ({ outline = true, position = "bottom", background = true }: LSProps) => {
    const router = useRouter()
    const { pathname, query } = router
    const { locale, locales } = router

    const handleSelect = (lang: string) => {
        router.push({ pathname, query}, router.asPath, { locale: lang })
    }

    let postionClasses = "mt-1 shadow-lg"
    if (position == "top") {
        postionClasses = "bottom-10 shadow"
    }

    return (
        <>
            <Listbox value={ locale } onChange={ handleSelect }>
                <div className="relative mt-1">
                    <Listbox.Button className={`relative w-full min-w-[10rem] cursor-pointer rounded ${background ? "bg-white" : '' } ${outline ? 'border shadow-sm' : '' } border-gray-300 py-2 pl-3 pr-10 text-left focus:outline-none focus:ring focus:ring-blue-300 transition duratin-200 sm:text-sm`}>
                        <div className="block truncate">
                            <span className={notoEmoji.className + " mr-2"}>
                                {languages[locale!].icon}
                            </span>
                            {languages[locale!].name}
                        </div>
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
                        <Listbox.Options className={`absolute ${postionClasses} max-h-60 w-full overflow-auto rounded bg-white border border-gray-200 text-base focus:outline-none focus:ring-blue-500 sm:text-sm`}>
                            {locales!.map((localeName, idx) => (
                                <Listbox.Option
                                    as="button"
                                    key={idx}
                                    className={({ active }) =>
                                        `w-full relative cursor-pointer select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`
                                    }
                                    value={localeName}
                                >
                                    {({ selected }) => (
                                        <>
                                            <div className={`text-left block truncate ml-2 ${ selected ? 'font-medium' : 'font-normal' }`}>
                                                <span className={notoEmoji.className + " mr-2"}>
                                                    { languages[localeName!].icon }
                                                </span>
                                                { languages[localeName].name }
                                            </div>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
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
