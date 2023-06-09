import { localize } from "@/i18n/i18n"
import { Inter } from "next/font/google"
import { useRouter } from "next/router"
import { LanguageSwitcher } from "../LanguageSwticher/LanguageSwitcher"

const inter = Inter({
    subsets: ['latin-ext']
})

const socialLinks = [
    {
        name: "bilibili",
        hover: "hover:text-blue-500",
        link: "https://space.bilibili.com/7185334",
        icon: (
            <svg fill="currentColor" viewBox="0 0 24 24" className="h-[24px] w-[24px]">
                <g>
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M18.223 3.086a1.25 1.25 0 0 1 0 1.768L17.08 5.996h1.17A3.75 3.75 0 0 1 22 9.747v7.5a3.75 3.75 0 0 1-3.75 3.75H5.75A3.75 3.75 0 0 1 2 17.247v-7.5a3.75 3.75 0 0 1 3.75-3.75h1.166L5.775 4.855a1.25 1.25 0 1 1 1.767-1.768l2.652 2.652c.079.079.145.165.198.257h3.213c.053-.092.12-.18.199-.258l2.651-2.652a1.25 1.25 0 0 1 1.768 0zm.027 5.42H5.75a1.25 1.25 0 0 0-1.247 1.157l-.003.094v7.5c0 .659.51 1.199 1.157 1.246l.093.004h12.5a1.25 1.25 0 0 0 1.247-1.157l.003-.093v-7.5c0-.69-.56-1.25-1.25-1.25zm-10 2.5c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25zm7.5 0c.69 0 1.25.56 1.25 1.25v1.25a1.25 1.25 0 1 1-2.5 0v-1.25c0-.69.56-1.25 1.25-1.25z"/>
                </g>
            </svg>
        ),
    },
    {
        name: "GitHub",
        hover: "hover:text-red-500",
        link: "https://github.com/sheey11",
        icon: (
            <svg fill="currentColor" viewBox="0 0 24 24" className="h-[24px] w-[24px]">
                <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        name: "Steam",
        hover: "hover:text-yellow-500",
        link: "https://steamcommunity.com/id/sheey-skywalker",
        icon: (
            <svg fill="currentColor" viewBox="0 0 32 32" className="h-[22px] w-[22px]">
                <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z"></path>
            </svg>
        ),
    },
]

interface FooterProps {
    padding?: boolean
    background?: boolean
}

export function Footer({ padding = true, background = true }: FooterProps) {
    const lang = useRouter().locale!
    return (
        <div className="w-full bg-white text-slate-500">
            <div className={`p-5 md:p-10 mx-auto ${padding ? "max-w-7xl sm:px-4 lg:px-8" : "px-8" } w-full h-full bg-white flex flex-col-reverse items-center space-y-2 space-y-reverse md:flex-row md:justify-between md:space-y-0`}>
                <div className={`text-xs select-none mt-2 md:mt-0 ${inter.className}`}>
                    <span className="text-center block font-bold md:text-left">{"© "} { new Date().getFullYear() } sheey. All rights reserved.</span>
                    <span className="text-center block md:text-left">{ localize(lang, "free_software_note") }</span>
                </div>
                <div className="flex flex-col-reverse items-center space-y-2 space-y-reverse sm:flex-row sm:space-x-4 sm:space-y-0">
                    <LanguageSwitcher outline={false} position="top" background={background} />
                    <div className="flex flex-row items-center space-x-4">
                    {socialLinks.map((link) => (
                        <a key={link.name} href={link.link} target="_blank" title={link.name} className={`${link.hover} transition duration-300`}>
                            { link.icon }
                        </a>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
