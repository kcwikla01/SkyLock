import { useEffect, useRef, useState } from 'react'
import keycloak from '../Auth/keycloak'
import { backendLogin } from '../services/api'

type TokenParsed = Record<string, any> | undefined

export default function useKeycloakAuth() {
    const [ready, setReady] = useState(false)
    const [authenticated, setAuthenticated] = useState(false)
    const [username, setUsername] = useState('')
    const [status, setStatus] = useState('')
    const [token, setToken] = useState<string | undefined>(undefined)
    const [tokenParsed, setTokenParsed] = useState<TokenParsed>(undefined)

    const didBackendLogin = useRef(false)
    const didInit = useRef(false)
    const timerRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        // KC callbacks: update React state when auth events happen
        keycloak.onAuthSuccess = () => {
            setAuthenticated(true)
            setToken(keycloak.token)
            setTokenParsed(keycloak.tokenParsed)
            void backendLoginOnce()
        }
        keycloak.onAuthError = (err) => console.warn('[KC] onAuthError', err)
        keycloak.onAuthLogout = () => {
            didBackendLogin.current = false
            setAuthenticated(false)
            setUsername('')
            setToken(undefined)
            setTokenParsed(undefined)
        }
        keycloak.onAuthRefreshSuccess = () => {
            setToken(keycloak.token)
            setTokenParsed(keycloak.tokenParsed)
        }
        keycloak.onAuthRefreshError = () => {
            console.warn('[KC] refresh error')
            setAuthenticated(false)
            setToken(undefined)
            setTokenParsed(undefined)
        }

        return () => {
            // cleanup callbacks (optional)
            keycloak.onAuthSuccess = undefined as any
            keycloak.onAuthError = undefined as any
            keycloak.onAuthLogout = undefined as any
            keycloak.onAuthRefreshSuccess = undefined as any
            keycloak.onAuthRefreshError = undefined as any
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (didInit.current) return
        didInit.current = true

        keycloak
            .init({
                onLoad: 'check-sso',
                pkceMethod: 'S256',
                silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
            })
            .then((auth) => {
                setAuthenticated(!!auth)
                setReady(true)
                setToken(keycloak.token)
                setTokenParsed(keycloak.tokenParsed)
                // periodic token refresh and state update
                timerRef.current = window.setInterval(() => {
                    keycloak
                        .updateToken(60)
                        .then(() => {
                            setToken(keycloak.token)
                            setTokenParsed(keycloak.tokenParsed)
                        })
                        .catch(() => {
                            setAuthenticated(false)
                            setToken(undefined)
                            setTokenParsed(undefined)
                        })
                }, 30000)
                if (auth) void backendLoginOnce()
            })
            .catch((e) => {
                console.error('[KC] init error', e)
                setReady(true)
                setAuthenticated(false)
            })

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current)
        }
    }, [])

    useEffect(() => {
        if (authenticated) {
            const u =
                (keycloak.tokenParsed?.preferred_username as string) ||
                (keycloak.tokenParsed?.name as string) ||
                ''
            setUsername(u)
            setToken(keycloak.token)
            setTokenParsed(keycloak.tokenParsed)
            void backendLoginOnce()
        } else {
            setUsername('')
            setToken(undefined)
            setTokenParsed(undefined)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated])

    async function backendLoginOnce() {
        if (didBackendLogin.current) return
        await keycloak.updateToken(30).catch(() => { })
        const t = keycloak.token
        if (!t) {
            setStatus('Brak tokenu')
            return
        }
        setStatus('Wywołuję /api/auth/login...')
        const res = await backendLogin(t)
        if (res.ok) {
            didBackendLogin.current = true
            setStatus('Backend login OK')
            setToken(t)
            setTokenParsed(keycloak.tokenParsed)
        } else {
            const text = await res.text().catch(() => '')
            setStatus(`Backend login failed: ${res.status} ${text}`)
        }
    }

    // get token (tries to refresh, updates state)
    async function getToken(): Promise<string | undefined> {
        try {
            await keycloak.updateToken(30)
            setToken(keycloak.token)
            setTokenParsed(keycloak.tokenParsed)
            return keycloak.token
        } catch {
            // fallback to existing token state
            return token
        }
    }

    async function login() {
        await keycloak.login({ redirectUri: window.location.origin })
    }
    async function logout() {
        await keycloak.logout({ redirectUri: window.location.origin })
        setStatus('')
        didBackendLogin.current = false
        setToken(undefined)
        setTokenParsed(undefined)
        setAuthenticated(false)
    }

    return {
        ready,
        authenticated,
        username,
        status,
        setStatus,
        token,
        tokenParsed,
        backendLoginOnce,
        getToken,
        login,
        logout,
    }
}