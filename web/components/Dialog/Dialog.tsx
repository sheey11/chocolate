import React, { Fragment } from 'react'
import { Dialog as HDialog, Transition } from '@headlessui/react'

function getChild<T extends React.FC>(children: JSX.Element | JSX.Element[], component: T): JSX.Element | null {
    const result: JSX.Element[] = []
    const type: string[] = [component.name] || [component.displayName]

    React.Children.forEach(children, (child) => {
        const childType: string = child && child.type && (child.type.displayName || child.type.name)
        if (type.includes(childType)) {
            result.push(child);
        }
    })

    if(result.length == 0) return null
    return result[0]
}

interface ContentProps { children?: string | JSX.Element | JSX.Element[] }
interface ActionProps { children?: string | JSX.Element | JSX.Element[], align?: "left" | "right" | "middle" }

const Content: React.FC<ContentProps> = ({ children }) => <> { children } </>;
const Actions: React.FC<ActionProps> = ({ children, align = "right" }) => {
    let flexOptions = "justify-end"
    if (align == "left") {
        flexOptions = "justify-start"
    } else if (align == "middle") {
        flexOptions = "justify-around"
    }
    return (
        <div className={`flex flex-row space-x-4 ${flexOptions}`}>
            { children }
        </div>
    )
}

interface DialogProps {
    children: JSX.Element | JSX.Element[],
    backdropClosable?: boolean,
    open: boolean,
    onClose: () => void,
}

interface DialogSubComponents {
    Content: typeof Content,
    Actions: typeof Actions,
}

const Dialog: React.FC<DialogProps> & DialogSubComponents = ({ children, backdropClosable, open, onClose }: DialogProps) => {
    const content = getChild(children, Content)
    const actions = getChild(children, Actions)

    return (
        <Transition show={open} as={Fragment}>
            <HDialog onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" onClick={backdropClosable ? onClose : () => {}} />
                </Transition.Child>
                <div className="fixed inset-0">
                    <div className="flex w-full h-full items-center justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95">
                            <HDialog.Panel className="w-full max-w-md bg-white transform overflow-hidden rounded-lg shadow-xl transition-all">
                                <div className="p-6 w-full">
                                    { content }
                                </div>
                                <div className="p-4 w-full bg-gray-100">
                                    { actions }
                                </div>
                            </HDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </HDialog>
        </Transition>
    )
}

Dialog.Content = Content
Dialog.Actions = Actions

export default Dialog
