import { FileDto } from '../types'

async function jsonOrText(resp: Response) {
    const ct = resp.headers.get('content-type') || ''
    if (ct.includes('application/json')) return resp.json()
    return resp.text()
}

export async function backendLogin(token: string) {
    return fetch('/api/auth/login', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
}

export async function getFiles(token: string): Promise<FileDto[]> {
    const res = await fetch('/api/File/GetFiles', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`GetFiles failed ${res.status}`)
    return (await res.json()) as FileDto[]
}

// Upload encrypted blob (blob already contains IV as prefix; backend just stores file)
// filename is optional; pass original name if you want backend to store it
export async function uploadEncryptedFilePrefixed(token: string, encryptedBlob: Blob, filename?: string, path?: string) {
    const form = new FormData()
    form.append('file', encryptedBlob, filename || 'file.enc')
    if (filename) form.append('originalFilename', filename)
    form.append('path', path ?? '') // zawsze dołączamy path ('' = root)

    // debug: pokaż zawartość FormData
    for (const entry of form.entries()) {
        console.log('[upload] form entry:', entry[0], entry[1])
    }

    const res = await fetch('/api/File/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        credentials: 'include',
    })

    const text = await res.text().catch(() => '')
    console.log('[upload] response status:', res.status, 'body:', text)

    // zwracaj odpowiedź lub wyrzuć, żeby App mogło ją obsłużyć
    if (!res.ok) {
        throw new Error(`Upload failed ${res.status} ${text}`)
    }
    // jeśli chcesz oryginalny Response obiektem, trzeba by parsować JSON z text
    return res
}

// Download encrypted file. Returns { blob, filename }.
// The blob contains IV as first 12 bytes (prefixed).
export async function downloadEncryptedFilePrefixed(token: string, id: string) {
    const res = await fetch(`/api/File/download/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
    if (!res.ok) {
        const body = await jsonOrText(res).catch(() => '')
        throw new Error(`Download failed ${res.status} ${String(body)}`)
    }
    const blob = await res.blob()
    const filename = res.headers.get('X-File-Name') || undefined
    return { blob, filename }
}

export async function deleteFileApi(token: string, id: string) {
    return fetch(`/api/File/delete/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
}