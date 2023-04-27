import React, { useEffect } from 'react'

import { useRouter } from 'next/router'
import { localize, localizeError } from '@/i18n/i18n'
import Button from '@/components/Button/Button'

import { Footer } from '@/components/Footer/Footer'
import { AuthContext } from '@/contexts/AuthContext'
import { ExclamationCircleIcon, HandRaisedIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { TitleContext } from '@/contexts/TitleContext'

export default function Login() {
  const router = useRouter()
  const lang = router.locale!

  const [errMsg, setErrMsg] = React.useState('');
  const [welcomeMsg, setWelcomeMsg] = React.useState('');

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  
  const [loginSuccess, setLoginSuccess] = React.useState(false)
  const [isSigninOnGoing, setIsSigninOnGoing] = React.useState(false)

  const { signin } = React.useContext(AuthContext)
  const { setTitle } = React.useContext(TitleContext)
  useEffect(() => {
    setTitle([localize(lang, "signin")])
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigninOnGoing(true)

    signin(username, password)
      .then((response) => {
        setWelcomeMsg(response.username)
        setErrMsg("")
        setLoginSuccess(true)

        let jump = "/"
        if(response.role === "administrator") {
          jump = "/dashboard/overview"
        }
        setTimeout(() => {
          router.push(jump)
        }, 1000)
      })
      .catch((error) => {
        console.error(error)
        if (error.response) {
          setErrMsg(localizeError(lang, error.response.data.code))
        }
      })
      .finally(() => {
        setIsSigninOnGoing(false)
      })
    return false
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-8.8rem)] sm:min-h-[calc(100vh-7.5rem)] flex-col justify-center pb-8 md:py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600"
            alt="Chocolate"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">{ localize(lang, 'sign_in_to_your_account') }</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            { localize(lang, 'chocoloate_current_not_support_registration') }
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white p-8 sm:shadow sm:rounded-lg sm:px-10">

            {
              errMsg != '' ? (
                <div className='py-2 px-3 mb-4 rounded bg-red-500 text-white font-semibold flex items-center justify-between'>
                  <div className="h-full flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mx-2 inline-block"/>
                    { errMsg }
                  </div>
                  <button
                    className="h-full rounded focus:outline-none focus:ring focus:ring-blue-100 transition duraion-200"
                    onClick={() => setErrMsg('')}
                  >
                    <XMarkIcon className="h-4 w-4"/>
                  </button>
                </div> 
              ) : <></>
            }

            {
              welcomeMsg != '' ? (
                <div className='py-2 px-3 mb-4 rounded bg-green-500 text-white font-semibold flex items-center'>
                  <HandRaisedIcon className="h-4 w-4 ml-1 mr-2 rotate-[30deg] inline-block"/>
                  { `${localize(lang, 'welcome_back')}${welcomeMsg}` }
                </div> 
              ) : <></>
            }

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username-field" className="block text-sm font-medium text-gray-700">
                  {localize(lang, 'username')}
                </label>
                <div className="mt-1">
                  <input
                    id="username-field"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 sm:text-sm transition ease duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-field" className="block text-sm font-medium text-gray-700">
                  {localize(lang, 'password')}
                </label>
                <div className="mt-1">
                  <input
                    id="password-field"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:ring focus:ring-blue-500 sm:text-sm transition ease duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me-field"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring focus:ring-offset-0 focus:ring-blue-300 transition ease duration-200"
                    data-1p-ignore
                  />
                  <label htmlFor="remember-me-field" className="ml-2 block text-sm text-gray-900">
                    {localize(lang, "remember_me")}
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="pl-1 rounded font-medium text-blue-600 hover:text-hover-500 focus:outline-none focus:ring focus:ring-blue-500 transition duration-200">
                    {localize(lang, "forgot_password")}
                  </a>
                </div>
              </div>

              <div>
                <Button disabled={loginSuccess || isSigninOnGoing} type="primary" size="large" fullWidth submit>
                  { isSigninOnGoing ? (
                    <svg className="animate-spin inline-block mx-2 -mt-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : <></>
                  }
                  <span>
                    { localize(lang, "signin") }
                  </span>
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    { localize(lang, "or_continue_with") }
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with Apple</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5">
                      <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282z"/> <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282z"/>
                    </svg>
                  </a>
                </div>

                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with Steam</span>
                    <svg fill="currentColor" viewBox="0 0 32 32" className="h-5 w-5">
                      <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z"></path>
                    </svg>
                  </a>
                </div>

                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with GitHub</span>
                    <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
