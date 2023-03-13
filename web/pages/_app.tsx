import { AuthContext } from '@/contexts/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Noto_Color_Emoji, Noto_Sans_SC } from 'next/font/google'

const notoEmoji = Noto_Color_Emoji({
  weight: "400",
  subsets: ["emoji"],
})

const notoSansSC = Noto_Sans_SC({
  weight: "400",
  subsets: ['latin'],
})

export default function App({ Component, pageProps }: AppProps) {
  const { authenticated, getUser, login, logout } = useAuth()

  return (
    <main className={`${notoEmoji.className} ${notoSansSC.className}`}>
      <AuthContext.Provider value={{ authenticated, getUser, login, logout }}>
        <Component {...pageProps} />
      </AuthContext.Provider>
    </main>
  )
}
