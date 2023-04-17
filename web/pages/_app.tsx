import { AuthContext } from '@/contexts/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter, Fira_Code, Lato, Chivo_Mono, JetBrains_Mono } from 'next/font/google'

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

  return (
    <div className={`min-h-[100vh] ${inter.className} ${firaMono.variable} ${inter.variable} ${lato.variable} ${monoFont.variable} ${jbm.variable}`}>
      <AuthContext.Provider value={{ authenticated, getUser, signin, signout }}>
        <Component {...pageProps} />
      </AuthContext.Provider>
    </div>
  )
}
