import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Disclosure, Popover, Transition } from "@headlessui/react"
import TimeRangeSelector from "@/components/TimeRangeSelector/TimeRangeSelector"
import { AccountHistoryResponse, AccountWatchingHistory, ChocolcateResponse } from "@/api/v1/datatypes"
import { useRouter } from "next/router"
import { ChevronLeftIcon, ChevronRightIcon, } from '@heroicons/react/24/outline'
import { localize } from "@/i18n/i18n"
import { classNames } from "@/utils/classnames"
import { fetchAccountHistory } from "@/api/v1/admin/account"
import debounce from "@/utils/debounce"
import Link from "next/link"

interface Day {
  year: number,
  month: number,
  day: number,
}

interface AccountHistoryProps {
    username: string | undefined,
    onError: (arg0: ChocolcateResponse) => void,
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

export default function AccountHistory({ username, onError }: AccountHistoryProps) {
    const now = dayjs()
    const [calanderShowingDate,    setCalanderShowingDate   ] = useState<number[]                       >([now.year(), now.month()])
    const [currentSelectedDate,    setCurrentSelectedDate   ] = useState<number[]                       >([now.year(), now.month(), now.date()])
    const [timeRange,              setTimeRange             ] = useState<number[]                       >([6 * 60 * 60, 18 * 60 * 60])
    const [accountHistory,         setAccountHistory        ] = useState<AccountWatchingHistory[] | null>(null)

    const lang = useRouter().locale!

    const calenderDays = useMemo(() => {
        const [year, month] = calanderShowingDate
        const firstDayOfCurrentMonth = dayjs(new Date(year, month, 1))
        const lastDayOfCurrentMonth = firstDayOfCurrentMonth.endOf('month')

        let result: Day[] = []

        let iter = firstDayOfCurrentMonth.clone()
        while(iter.day() != 0){
            iter = iter.subtract(1, 'day')
            result = [{ year: iter.year(), month: iter.month(), day: iter.date()}, ...result]
        }

        iter = firstDayOfCurrentMonth.clone()
        while(iter.isBefore(lastDayOfCurrentMonth) || iter.isSame(lastDayOfCurrentMonth)) {
            result.push({ year: iter.year(), month: iter.month(), day: iter.date()})
            iter = iter.add(1, 'day')
        }

        iter = lastDayOfCurrentMonth
        while(iter.day() != 6){
            iter = iter.add(1, 'day')
            result.push({ year: iter.year(), month: iter.month(), day: iter.date()})
        }

        return result
    }, [calanderShowingDate])

    const increaseCalanderMonth = () => setCalanderShowingDate(v => {
        const m     = v[1] == 11 ? 0 : v[1] + 1
        const carry = v[1] == 11 ? 1 : 0
        return [v[0] + carry, m]
    })

    const decreaseCalanderMonth = () => setCalanderShowingDate(v => {
        const m     = v[1] == 0 ? 11 : v[1] - 1
        const carry = v[1] == 0 ? -1 : 0
        return [v[0] + carry, m]
    })

    const handleTimeRangeChange = debounce((v: number[]) => setTimeRange(v), 500)

    const fetchHistory = useCallback((username: string, selectedDate: number[], timeRange: number[]) => {
        const [y, m, d] = selectedDate
        const selectedDateTimestamp = dayjs(new Date(y, m, d)).unix()
        fetchAccountHistory(username, {
            start: selectedDateTimestamp + timeRange[0],
            end: selectedDateTimestamp + timeRange[1],
        })
            .then(r => setAccountHistory(r.history))
            .catch(onError)
    }, [onError])

    useEffect(() => {
        if(!username) return
        fetchHistory(username, currentSelectedDate, timeRange)
    }, [username, currentSelectedDate, timeRange, fetchHistory])

    return(
        <>
            <div className="mt-6 flow-root">
                <div className="flex justify-around text-sm mb-2">
                    <Popover className="relative">
                        <Popover.Button
                            onClick={() => setCalanderShowingDate([currentSelectedDate[0], currentSelectedDate[1]])}
                            className="w-32 text-center py-1 rounded hover:ring hover:ring-gray-100 transition duration-200 text-gray-500 font-bold focus:outline-none"
                        >
                            { function() {
                                const [y, m, d] = currentSelectedDate
                                return new Date(y, m, d).toLocaleDateString(lang)
                            }() }
                        </Popover.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Popover.Panel className="absolute bottom-9 w-96 -left-32 bg-white px-4 py-4 rounded border border-gray-100 shadow-md">
                                <div>
                                    <div className="flex items-center">
                                        <h2 className="flex-auto font-semibold text-gray-900">
                                            { function() {
                                                const [y, m] = calanderShowingDate 
                                                return new Date(y, m, 1).toLocaleDateString(lang, { year: "numeric", month: "long" })
                                            }() }
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => decreaseCalanderMonth()}
                                            className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">{ localize(lang, "previous_month") }</span>
                                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => increaseCalanderMonth()}
                                            className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">{ localize(lang, "next_month") }</span>
                                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                                        <div>M</div>
                                        <div>T</div>
                                        <div>W</div>
                                        <div>T</div>
                                        <div>F</div>
                                        <div>S</div>
                                        <div>S</div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-7 text-sm">
                                        {calenderDays.map((day, dayIdx) => {
                                            const currentMonth = day.year == calanderShowingDate[0] && day.month == calanderShowingDate[1]
                                            const selected = [day.year, day.month, day.day].reduce((r, c, i) => r && c == currentSelectedDate[i], true)
                                            const today = currentMonth && day.day == now.date()
                                            const str = `${day.year}-${day.month}-${day.day}`

                                            return (
                                                <div
                                                    key={str}
                                                    className={classNames(dayIdx > 6 && 'border-t border-gray-200', 'py-2')}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentSelectedDate([day.year, day.month, day.day])}
                                                        className={classNames(
                                                            selected && 'text-white',
                                                            !selected && today && 'text-blue-600',
                                                            !selected && !today && currentMonth && 'text-gray-900',
                                                            !selected && !today && !currentMonth && 'text-gray-400',
                                                            selected && today && 'bg-blue-600',
                                                            selected && !today && 'bg-gray-900',
                                                            !selected && 'hover:bg-gray-200 transition duraion-200',
                                                            (selected || today) && 'font-semibold',
                                                            'mx-auto flex h-8 w-8 items-center justify-center rounded-full'
                                                        )}
                                                    >
                                                        <time dateTime={str}>{ day.day }</time>
                                                    </button>
                                                </div>
                                            )})}
                                    </div>
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </Popover>
                </div>
                <TimeRangeSelector onChange={handleTimeRangeChange}/>
            </div>
            <div className="mt-5 space-y-4 flex flex-col items-stretch" role="list">
                { accountHistory?.length == 0 ?
                    <div className="p-10 text-center text-gray-500 font-bold"> { localize(lang, "no_data") } </div>
                    :
                    <></>
                }
                { accountHistory?.map((h, i) => (
                    <div key={h.start_time + h.end_time} role="listitem" className="p-3 rounded border-2 border-gray-100 flex flex-col items-start space-y-2">
                        <div className="flex items-center space-x-4 w-full">
                            <div aria-hidden className={classNames(
                                "h-16 w-16 rounded text-white text-lg font-bold flex items-center justify-around flex-shrink-0",
                                colorPattles[i % colorPattles.length]
                            )}>
                                {h.room_title.at(0)}
                            </div>
                            <div className="w-full flex-shrink-1 text-left">
                                <h2 className="font-medium">
                                    <Link href={`/dashboard/rooms/${h.room_id}`}>
                                        { h.room_owner_username }
                                    </Link>
                                    {" / "}
                                    <Link href={`/dashboard/rooms/${h.room_id}`}>
                                        { h.room_title }
                                    </Link>
                                </h2>
                                <span className="text-sm text-gray-500">
                                    <time dateTime={h.start_time}>{ new Date(h.start_time).toLocaleTimeString(lang) }</time>
                                    {" - "}
                                    <time dateTime={h.end_time}>{ new Date(h.end_time).toLocaleTimeString(lang) }</time>
                                </span>
                            </div>
                        </div>
                        <div className="ml-[5rem] flex flex-col space-y-1 w-full">
                            <div key={h.start_time} className="w-full flex items-center space-x-2 text-sm">
                                <time dateTime={h.start_time} className="font-mono"> { new Date(h.start_time).toLocaleTimeString(lang) } </time>
                                <span>{ username } { localize(lang, "enters_room") }</span>
                            </div>
                            { h.chats.map(c => (
                                <div key={c.time} className="w-full flex items-center space-x-2 text-sm">
                                    <time dateTime={c.time} className="font-mono"> { new Date(c.time).toLocaleTimeString(lang) } </time>
                                    <span>{ username }:</span>
                                    <span>{ c.content }</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
