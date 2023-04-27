import { AuthContext } from '@/contexts/AuthContext'
import { TitleContext } from '@/contexts/TitleContext'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter, Fira_Code, Lato, Chivo_Mono, JetBrains_Mono } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

const inter = Inter({
  subsets: ['latin-ext'],
  variable: '--inter-font',
})

const firaMono = Fira_Code({
  variable: '--fira-code-font',
  subsets: ['latin'],
})

const lato = Lato({
  variable: '--lato-font',
  subsets: ['latin'],
  weight: '400',
})

const monoFont = Chivo_Mono({
  weight: "400",
  subsets: ['latin'],
  variable: "--mono-font",
})

const jbm = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
  variable: '--jbm-font',
})

export default function App({ Component, pageProps }: AppProps) {
  const { authenticated, getUser, signin, signout } = useAuth()
  const title = useRef<string>('Chocolate')

  const setTitle = (t: string[]) => {
    title.current = ['Chocolate', ...t].reverse().join(" | ")
    if (document) document.title = title.current
  }

  const setRawTitle = (t: string) => {
    title.current = t
    if (document) document.title = title.current
  }

  return (
    <div className={`min-h-[100vh] ${inter.className} ${firaMono.variable} ${inter.variable} ${lato.variable} ${monoFont.variable} ${jbm.variable}`}>
      <TitleContext.Provider value={{title: title.current, setTitle, setRawTitle}}>
        <AuthContext.Provider value={{ authenticated, getUser, signin, signout }}>
          <Component {...pageProps} />
        </AuthContext.Provider>
      </TitleContext.Provider>
    </div>
  )
}
