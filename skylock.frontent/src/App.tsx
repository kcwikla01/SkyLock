import { useEffect, useRef, useState } from 'react'
import './styles.css'
import keycloak from './Auth/keycloak'

type FileDto = {
    fileId?: string; FileId?: string
    originalFileName?: string; OriginalFileName?: string
    storageType?: string; StorageType?: string
    uploadedAt?: string; UploadedAt?: string
}

export default function App() {
    const [ready, setReady] = useState(false)
    const [authenticated, setAuthenticated] = useState(false)
    const [status, setStatus] = useState('')
    const [username, setUsername] = useState('')
    const [files, setFiles] = useState<FileDto[]>([])
    const [busyId, setBusyId] = useState<string | null>(null)
    const [busyUpload, setBusyUpload] = useState(false)
    const didBackendLogin = useRef(false)
    const didInit = useRef(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        keycloak.onAuthSuccess = () => { setAuthenticated(true); void backendLoginOnce() }
        keycloak.onAuthError = (err) => console.warn('[KC] onAuthError', err)
        keycloak.onAuthLogout = () => { didBackendLogin.current = false; setAuthenticated(false); setUsername(''); setFiles([]) }
    }, [])

    useEffect(() => {
        if (didInit.current) return
        didInit.current = true

        let timer: number | undefined
        keycloak.init({
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        })
            .then((auth) => {
                setAuthenticated(!!auth)
                setReady(true)
                timer = window.setInterval(() => {
                    keycloak.updateToken(60).catch(() => setAuthenticated(false))
                }, 30000)
                if (auth) void backendLoginOnce()
            })
            .catch((e) => {
                console.error('[KC] init error', e)
                setReady(true)
                setAuthenticated(false)
            })
        return () => { if (timer) window.clearInterval(timer) }
    }, [])

    useEffect(() => {
        if (authenticated) {
            const u = (keycloak.tokenParsed?.preferred_username as string) || (keycloak.tokenParsed?.name as string) || ''
            setUsername(u)
            void fetchFiles()
        } else {
            setUsername('')
            setFiles([])
        }
    }, [authenticated])

    useEffect(() => { if (authenticated) void backendLoginOnce() }, [authenticated])

    function getId(f: FileDto) { return f.fileId ?? f.FileId }
    function getName(f: FileDto) { return f.originalFileName ?? f.OriginalFileName ?? '(bez nazwy)' }

    async function backendLoginOnce() {
        if (didBackendLogin.current) return
        await keycloak.updateToken(30).catch(() => { })
        const token = keycloak.token
        if (!token) { setStatus('Brak tokenu'); return }

        setStatus('Wywołuję /api/auth/login...')
        const res = await fetch('/api/auth/login', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        })
        if (res.ok) { didBackendLogin.current = true; setStatus('Backend login OK') }
        else { setStatus(`Backend login failed: ${res.status} ${await res.text().catch(() => '')}`) }
    }

    async function fetchFiles() {
        await keycloak.updateToken(30).catch(() => { })
        const token = keycloak.token
        if (!token) return
        const res = await fetch('/api/File/GetFiles', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        })
        if (res.ok) {
            const data = await res.json() as FileDto[]
            setFiles(data)
        } else {
            console.warn('GetFiles failed', res.status)
            setFiles([])
        }
    }

    async function downloadFile(f: FileDto) {
        const id = getId(f)
        if (!id) return
        setBusyId(id)
        try {
            await keycloak.updateToken(30).catch(() => { })
            const token = keycloak.token
            if (!token) return
            const res = await fetch(`/api/File/download/${encodeURIComponent(id)}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (!res.ok) {
                setStatus(`Pobieranie nie powiodło się: ${res.status}`)
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = getName(f)
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } finally {
            setBusyId(null)
        }
    }

    async function deleteFile(f: FileDto) {
        const id = getId(f)
        if (!id) return
        if (!confirm(`Usunąć plik: ${getName(f)}?`)) return
        setBusyId(id)
        try {
            await keycloak.updateToken(30).catch(() => { })
            const token = keycloak.token
            if (!token) return
            const res = await fetch(`/api/File/delete/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                setFiles(prev => prev.filter(x => getId(x) !== id))
            } else {
                setStatus(`Usuwanie nie powiodło się: ${res.status}`)
            }
        } finally {
            setBusyId(null)
        }
    }

    function openFilePicker() {
        fileInputRef.current?.click()
    }

    async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setBusyUpload(true)
        try {
            await keycloak.updateToken(30).catch(() => { })
            const token = keycloak.token
            if (!token) return
            const form = new FormData()
            form.append('file', file)
            const res = await fetch('/api/File/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
                credentials: 'include',
            })
            if (res.ok) {
                setStatus('Plik przesłany')
                await fetchFiles()
            } else {
                setStatus(`Upload nie powiódł się: ${res.status}`)
            }
        } finally {
            setBusyUpload(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function login() { await keycloak.login({ redirectUri: window.location.origin }) }
    async function logout() { await keycloak.logout({ redirectUri: window.location.origin }); setStatus(''); didBackendLogin.current = false }

    const displayName = username || 'Użytkownik'

    if (!ready) return <div className="page"><section className="card"><p>Ładowanie…</p></section></div>

    return (
        <div className="page">
            {authenticated && (
                <div className="top-greeting">
                    <div className="hello">Witaj, <span className="nick">{displayName}</span></div>
                    <button className="btn btn-outline-light btn-sm" onClick={logout}>Wyloguj</button>
                </div>
            )}

            <header className="header">
                <h1>Skylock</h1>
                <p className="subtitle">Cloud-based multimedia service</p>
            </header>

            <main className="content">
                {!authenticated ? (
                    <section className="card">
                        <h2>Witaj!</h2>
                        <p>Zaloguj się, aby kontynuować.</p>
                        <button onClick={login}>Zaloguj</button>
                    </section>
                ) : (
                    <>
                        <section className="card">
                            <div className="card-header-row">
                                <h2 className="text-center">Twoje pliki :</h2>
                                <div className="card-actions">
                                    <button className="btn btn-primary btn-sm" onClick={openFilePicker} disabled={busyUpload}>
                                        {busyUpload ? 'Wysyłanie…' : 'Upload'}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={onFilePicked}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {files.length === 0 ? (
                                <p className="hint">Brak plików</p>
                            ) : (
                                <div className="tiles">
                                    {files.map((f, i) => {
                                        const id = getId(f) ?? String(i)
                                        const name = getName(f)
                                        const isBusy = busyId === id
                                        return (
                                            <div key={id} className="tile">
                                                <div className="name" title={name}>{name}</div>
                                                <div className="actions">
                                                    <button
                                                        type="button"
                                                        className="icon-btn"
                                                        aria-label={`Pobierz ${name}`}
                                                        disabled={isBusy}
                                                        onClick={() => void downloadFile(f)}>
                                                        <i className="bi bi-download"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn danger"
                                                        aria-label={`Usuń ${name}`}
                                                        disabled={isBusy}
                                                        onClick={() => void deleteFile(f)}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>

                        {status && (
                            <section className="card">
                                <p className="hint">{status}</p>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}