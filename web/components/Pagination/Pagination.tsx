import { classNames } from "@/utils/classnames"
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid"

interface PageButtonProps {
    number: number,
    onClick: (arg0: number) => void,
    current: number
}

function PageButton({ number, onClick, current }: PageButtonProps) {
    return (
        <button
            onClick={() => number !== current && onClick(number)}
            className={classNames(
                "w-8 h-8 rounded-md",
                "hover:bg-gray-100",
                "focus:border-none focus:outline-none focus:ring focus:ring-blue-500",
                "transition duration-200",
                "text-sm",
                current == number ? "bg-gray-50" : "",
            )}
        >
            { number }
        </button>
    )
}

interface PaginationProps {
    page: number,
    total: number,
    handlePageSelection: (arg0: number) => void,
}

export default function Pagination({ page, total, handlePageSelection }: PaginationProps) {
    const universalButtonProps = {
        onClick: handlePageSelection,
        current: page,
    }

    if (total < 4) {
        return (
            <div className="flex flex-row space-x-4 items-center p-2">
                { Array(total).fill(0).map((_, i) => i + 1).map(v => 
                    <PageButton key={v} number={v} {...universalButtonProps} />
                )}
            </div>
        )
    }

    let neighborPages = [page - 1, page, page + 1]
    while(neighborPages[0] < 1)     neighborPages = neighborPages.map(v => v + 1)
    while(neighborPages[2] > total) neighborPages = neighborPages.map(v => v - 1)

    const neighborPagesPosition =
        (neighborPages[0] === 1 ? 'start' :
            (neighborPages[2] === total ? 'end' :
                'middle'
            )
        )

    const shouldRenderFirstEllipsis = neighborPages[0] != 2 && neighborPagesPosition === "middle"
    const shouldRenderSecondEllipsis = neighborPages[2] != total - 1 && neighborPagesPosition === "middle"
    const shouldRenderMiddleEllipsis = total > 4

    return (
        <div className="flex flex-row space-x-4 items-center p-2">
            { neighborPagesPosition === "start" ?
                neighborPages.map(v => 
                    <PageButton key={v} number={v} {...universalButtonProps} />
                )
                :
                <PageButton number={1} {...universalButtonProps} />
            }

            { /* ellipsis */ }
            { shouldRenderFirstEllipsis ? <EllipsisHorizontalIcon className="h-4 w-4"/> : <></> }

            { neighborPagesPosition === 'middle' ?
                neighborPages.map(v => 
                    <PageButton key={v} number={v} {...universalButtonProps} />
                )
                :
                shouldRenderMiddleEllipsis ? <EllipsisHorizontalIcon className="h-4 w-4"/> : <></>
            }

            { /* ellipsis */ }
            { shouldRenderSecondEllipsis ? <EllipsisHorizontalIcon className="h-4 w-4"/> : <></> }

            {
                neighborPagesPosition === "end" ?
                    neighborPages.map(v => 
                        <PageButton key={v} number={v} {...universalButtonProps} />
                    )
                    :
                    <PageButton number={total} {...universalButtonProps} />
            }
        </div>
    )
}
