import { localize } from '@/i18n/i18n'
import { classNames } from '@/utils/classnames'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ReactSlider from 'react-slider'

const hr_to_5min = (hr: number) => {
    return hr * 12
}

const _5min_to_hr = (min: number) => {
    return min / 12
}

const _5min_to_relative_sec = (min: number) => {
    return (min - hr_to_5min(12)) * 5 * 60
}

interface TimeRangeSelectorProps {
    onChange: (arg0: number[]) => void,
}

export default function TimeRangeSelector({ onChange }: TimeRangeSelectorProps) {
    const lang = useRouter().locale! as string
    const maxValue = hr_to_5min(48)

    const [value, setValue] = useState([hr_to_5min(18), hr_to_5min(30)])
    const setValueWithValidate = (value: number[], index: number) => {
        let nextValue = value
        if(_5min_to_hr(Math.abs(value[0] - value[1])) > 12) {
            if(index === 0) {
                nextValue = [value[0], value[0] + hr_to_5min(12)]
            } else {
                nextValue = [value[1] - hr_to_5min(12), value[1]]
            }
        }

        onChange(nextValue.map(v => _5min_to_relative_sec(v)))
        setValue(nextValue)
    }
    
    return (
        <div className="h-16 w-full relative mb-7">
            <ReactSlider
                max={maxValue}
                min={0}
                defaultValue={[hr_to_5min(18), hr_to_5min(30)]}
                ariaLabel={['lower', 'upper']}
                marks={hr_to_5min(1)}
                minDistance={hr_to_5min(2)}
                pearling
                value={value}
                onChange={setValueWithValidate}
                thumbClassName="h-5 w-2 focus:outline-none cursor-ew-resize"
                renderThumb={(props: any, { index }) => (
                    <div {...props}>
                        <div className="absolute h-11 w-[1px] top-5 bg-gray-500/40 left-0" />
                        { index == 0 ?
                            <div className="absolute h-full -left-[calc(0.25rem-1px)] w-1 bg-blue-500" />
                            :   
                            <div className="h-full mr-1 bg-blue-500" />
                        }
                    </div>
                )}
                renderTrack={(props: any, state) => (
                    <div {...props} className={classNames(
                        "h-16",
                        state.index == 0 || state.index == 2 ? "bg-blue-500/10" : "",
                        state.index == 0 ? "mr-2" : "",
                        state.index == 2 ? "ml-0" : "",
                    )}>
                    </div>
                )}
                renderMark={(props: any) => (
                    <div {...props} className="h-16">
                        {/* marker */}
                        <div className={classNames(
                            props.key % hr_to_5min(2) === 0 ? "h-16" : "h-3", 
                            (_5min_to_hr(props.key) + 12) % 24 === 0  ? "bg-gray-400" :
                                props.key === 0 || props.key === maxValue ? "bg-gray-400" : "bg-gray-500/20",
                            "absolute bottom-0 w-[1px]",
                        )}/>
                        { /* marker number */ }
                        { function() {
                            const mark  = (_5min_to_hr(props.key) + 12 ) % 24
                            if(mark === 0) return <></>
                            const first = props.key === 0
                            const last  = props.key === maxValue
                            const firstOrLast = first || last
                            return (
                                <span className={classNames(
                                    "absolute -bottom-4 text-xs select-none text-gray-400",
                                    mark % 2 == 0 ?
                                        mark % 4 == 0 ? "" : "hidden md:block"
                                        :
                                        "hidden lg:block",
                                    !firstOrLast && mark.toString().length == 3 ? "-left-2" : "",
                                    !firstOrLast && mark.toString().length == 2 ? "-left-1.5" : "",
                                    !firstOrLast && mark.toString().length == 1 ? "-left-1" : "",
                                    first ? "left-[1px]" : "",
                                    last ? "right-0" : "",
                                )}>
                                    { mark }
                                </span>
                            )
                        }()}
                    </div>
                )}
            />
            <div className={classNames(
                "absolute h-7 -bottom-7 border-x border-gray-400",
                "left-0",
                // 0.5 rem is the width of the thumb
                "right-[calc(0.75*(100%-0.5rem)+0.5rem-1px)]",
                "text-xs",
            )}>
                <span className="relative block top-4 w-full text-center text-gray-500 font-bold">{ localize(lang, "previous_day") }</span>
            </div>
            <div className={classNames(
                "absolute h-7 -bottom-7 border-x border-gray-400",
                "left-[calc(0.25*(100%-0.5rem))]",
                "right-[calc(0.25*(100%-0.5rem)+0.5rem-1px)]",
                "text-xs",
            )}>
                <span className="relative block top-4 w-full text-center text-gray-500 font-bold">{ localize(lang, "current_day") }</span>
            </div>
            <div className={classNames(
                "absolute h-7 -bottom-7 border-x border-gray-400",
                "left-[calc(0.75*(100%-0.5rem))]",
                "right-[calc(0.5rem-1px)]",
                "text-xs",
            )}>
                <span className="relative block top-4 w-full text-center text-gray-500 font-bold">{ localize(lang, "next_day") }</span>
            </div>
        </div>
    )
}
