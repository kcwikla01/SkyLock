import React, { useEffect, useState } from 'react'
import './styles.css'
import useKeycloakAuth from './hooks/useKeycloakAuth'
import { getId, getName, FileDto } from './types'
import * as api from './services/api'
import Header from './components/Header'
import FileList from './components/FileList'
import { encryptFilePrefixedIV, decryptPrefixedIVBlobToArrayBuffer } from './utils/cryptoUtils'

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

    const [directories, setDirectories] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>("");

    const handleFolderClick = (folderName: string) => {
        const nextPath = currentPath === "" ? folderName : `${currentPath}\\${folderName}`;
        setCurrentPath(nextPath);
        fetchFiles(next)
    };

    const handleBack = () => {
        if (currentPath === "") return;

        const parts = currentPath.split('\\');
        parts.pop();
        const parentPath = parts.join('\\');

        setCurrentPath(parentPath);
    };

    useEffect(() => {
        if (authenticated) void fetchFilesAndDirectory()
        else {
            setFiles([])
            setDirectories([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, currentPath])

    async function fetchFiles(nextPath: string) {
        const token = await getToken()
        if (!token) return
        const data = await api.getFiles(token, nextPath)
        setFiles(data)
    }

    async function fetchFilesAndDirectory() {
        const token = await getToken()
        if (!token) return
        try {
            const data = await api.getFiles(token, currentPath)
            const dirs = await api.getDirectories(token, currentPath);
            setDirectories(dirs);
            setFiles(data)
        } catch (e) {
            console.warn('GetFiles failed', e)
            setFiles([])
        }
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

    async function handleCreateFolder() {
        const t = await getToken()
        if (!t) { setStatus('Brak tokenu'); return }
        const name = prompt("Podaj nazwę nowego folderu:");
        if (!name || name.trim() === "") return;

        const fullPathForApi = currentPath === ""
            ? name.trim()
            : `${currentPath}\\${name.trim()}`;

        await api.createDirectory(t, fullPathForApi);
        const dirs = await api.getDirectories(t, currentPath);
        setDirectories(dirs);
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
            const res = await api.uploadEncryptedFilePrefixed(t, encryptedBlob, file.name, currentPath)
            if (res.ok) {
                setStatus('Plik przesłany (zaszyfrowany)')
                await fetchFiles(currentPath)
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
                                directories={directories || []}
                                currentPath={currentPath}
                                onFolderClick={handleFolderClick}
                                onBack={handleBack}
                                onCreateFolder={handleCreateFolder}
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