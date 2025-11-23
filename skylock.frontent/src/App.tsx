import React, { useEffect, useState } from 'react'
import './styles.css'
import useKeycloakAuth from './hooks/useKeycloakAuth'
import { getId, getName, FileDto } from './types'
import * as api from './services/api'
import Header from './components/Header'
import FileList from './components/FileList'
import { encryptFilePrefixedIV, decryptPrefixedIVBlobToArrayBuffer } from './utils/crypto'

export default function App() {
    const {
        ready,
        authenticated,
        username,
        status,
        setStatus,
        token,
        tokenParsed,
        getToken,
        login,
        logout,
    } = useKeycloakAuth()

    const [files, setFiles] = useState<FileDto[]>([])
    const [busyId, setBusyId] = useState<string | null>(null)
    const [busyUpload, setBusyUpload] = useState(false)

    // currentPath defaultowo na ""
    const [currentPath, setCurrentPath] = useState<string>('')

    useEffect(() => {
        if (authenticated) void fetchFiles()
        else setFiles([])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, currentPath])

    async function fetchFiles() {
        const token = await getToken()
        if (!token) return
        try {
            // najpierw poproś backend o pliki w currentPath (jeśli backend obsługuje param path)
            let data: FileDto[] = []
            try {
                data = await api.getFiles(token, currentPath)
            } catch (err) {
                // jeśli backend nie wspiera path albo zwraca błąd, spróbuj pobrać wszystko i przefiltrować lokalnie
                console.warn('getFiles(path) failed, trying getFiles() and client-side filter', err)
                try {
                    const all = await api.getFiles(token) // fallback bez path
                    data = all
                } catch (err2) {
                    throw err2
                }
            }

            // klient-side filtr jako safety: trzymaj tylko elementy z dokładnie tą ścieżką
            const normalizedCurrent = (currentPath || '').replace(/^\/+|\/+$/g, '')
            const filtered = data.filter((f) => ((f.path || '').replace(/^\/+|\/+$/g, '') === normalizedCurrent))
            setFiles(filtered)
        } catch (e) {
            console.warn('GetFiles failed', e)
            setFiles([])
        }
    }

    // Tymczasowa implementacja createFolderPrompt: pyta o nazwę, sanityzuje i ustawia currentPath
    async function createFolderPrompt() {
        const name = prompt('Nazwa nowego katalogu (w bieżącym katalogu):')
        if (!name) return
        const safe = name.replace(/[/\\]+/g, '').trim()
        if (!safe) return
        const newPath = currentPath ? `${currentPath}/${safe}` : safe
        // ustawiamy ścieżkę lokalnie (na razie nie wywołujemy backendu)
        setCurrentPath(newPath)
        setStatus?.(`Przejście do katalogu: ${newPath}`)
        try { await fetchFiles() } catch { }
    }

    async function handleDownload(f: FileDto) {
        const id = getId(f)
        if (!id) return
        setBusyId(id)
        try {
            const t = await getToken()
            if (!t) { setStatus('Brak tokenu'); return }

            const sub = (tokenParsed as any)?.sub as string | undefined
            if (!sub) { setStatus('Brak Keycloak sub'); return }

            const res = await api.downloadEncryptedFilePrefixed(t, id)
            const encryptedBlob = res.blob
            const plainAb = await decryptPrefixedIVBlobToArrayBuffer(encryptedBlob, sub)
            const downloadUrl = URL.createObjectURL(new Blob([plainAb], { type: encryptedBlob.type || 'application/octet-stream' }))
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = res.filename || getName(f)
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(downloadUrl)
        } catch (e) {
            setStatus(`Pobieranie/odszyfrowanie nie powiódł się: ${String(e)}`)
        } finally {
            setBusyId(null)
        }
    }

    async function handleDelete(f: FileDto) {
        const id = getId(f)
        if (!id) return
        if (!confirm(`Usunąć plik: ${getName(f)}?`)) return
        setBusyId(id)
        try {
            const token = await getToken()
            if (!token) return
            const res = await api.deleteFileApi(token, id)
            if (res.ok) {
                setFiles((prev) => prev.filter((x) => getId(x) !== id))
            } else {
                setStatus(`Usuwanie nie powiodło się: ${res.status}`)
            }
        } catch (e) {
            setStatus(`Usuwanie nie powiodło się: ${String(e)}`)
        } finally {
            setBusyId(null)
        }
    }

    async function handleUpload(file: File) {
        setBusyUpload(true)
        try {
            const t = await getToken()
            if (!t) { setStatus('Brak tokenu'); return }

            const sub = (tokenParsed as any)?.sub as string | undefined
            if (!sub) { setStatus('Brak Keycloak sub'); return }

            // encrypt and upload
            const encRes = await encryptFilePrefixedIV(file, sub)
            const encryptedBlob = encRes.blob
            // send currentPath as path metadata
            const res = await api.uploadEncryptedFilePrefixed(t, encryptedBlob, file.name, currentPath)
            if (res.ok) {
                setStatus('Plik przesłany (zaszyfrowany)')
                await fetchFiles()
            } else {
                const body = await res.text().catch(() => '')
                setStatus(`Upload nie powiódł się: ${res.status} ${body}`)
            }
        } catch (e) {
            setStatus(`Upload nie powiódł się: ${String(e)}`)
        } finally {
            setBusyUpload(false)
        }
    }

    const displayName = username || 'Użytkownik'

    if (!ready) return (
        <div className="page">
            <section className="card">
                <p>Ładowanie…</p>
            </section>
        </div>
    )

    return (
        <div className="page">
            <Header authenticated={authenticated} displayName={displayName} onLogout={logout} />

            <main className="content">
                {!authenticated ? (
                    <section className="card">
                        <h2>Witaj!</h2>
                        <p>Zaloguj się, aby kontynuować.</p>
                        <button onClick={login}>Zaloguj</button>
                    </section>
                ) : (
                    <>
                        <FileList
                            files={files}
                            busyId={busyId}
                            busyUpload={busyUpload}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                            onUpload={handleUpload}
                            onNavigate={(path: string) => setCurrentPath(path)}
                            onCreateFolder={createFolderPrompt}
                        />

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