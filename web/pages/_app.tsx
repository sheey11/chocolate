import { AuthContext } from '@/contexts/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter, Fira_Code, Lato } from 'next/font/google'

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

export default function App({ Component, pageProps }: AppProps) {
  const { authenticated, getUser, signin, signout } = useAuth()

  return (
     <div className={`min-h-[100vh] ${inter.className} ${firaMono.variable} ${inter.variable} ${lato.variable}`}>
      <AuthContext.Provider value={{ authenticated, getUser, signin, signout }}>
        <Component {...pageProps} />
      </AuthContext.Provider>
    </div>
  )
}
