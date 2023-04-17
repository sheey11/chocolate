import Button from "@/components/Button/Button"
import MessageQueue, { MessageQueueHandle } from "@/components/MessageQueue/MessageQueue"
import TimeRangeSelector from "@/components/TimeRangeSelector/TimeRangeSelector"
import { useRef, useState } from "react"

export default function TestPage() {
  const [timeRange, setTimeRange] = useState<number[]>([])

  const mqRef = useRef<MessageQueueHandle | null>(null)

  return (
    <>
      <MessageQueue ref={mqRef} />
      <main className="p-5 w-full min-h-full space-y-20">
        <section>
          <div className="w-[1000px]">
            <h2 className="py-2 font-bold text-xl">TimeRangeSelector</h2>
            <span className="text-sm font-mono"> { timeRange[0] }, { timeRange[1] } </span>
            <TimeRangeSelector onChange={setTimeRange}/>
          </div>
        </section>
        <section>
          <h2 className="py-2 font-bold text-xl">MessageQueue</h2>
          <div className="space-x-4">
            <Button onClick={() => mqRef.current?.success("success content", "success title")}>
              Emit success
            </Button>
            <Button onClick={() => mqRef.current?.error("dawdaw", "title")}>
              Emit error
            </Button>
            <Button onClick={() => mqRef.current?.success("auto close", "title", true)}>
              Emit autoClose
            </Button>
          </div>
        </section>
        <div className="h-[200vh]"/>
      </main>
    </>
  )
}
