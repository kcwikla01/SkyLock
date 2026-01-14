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

export async function getFiles(token: string, currentPath: string): Promise<FileDto[]> {
    const res = await fetch(`/api/File/GetFiles?FilePath=${currentPath}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`GetFiles failed ${res.status}`)
    return (await res.json()) as FileDto[]
}

export async function getDirectories(token: string, folderPath: string = ""): Promise<string[]> {
    // Ważne: FolderPath musi pasować do Twojego C# public async Task<IActionResult> GetDirectories(string? FolderPath)
    const res = await fetch(`/api/Directory?FolderPath=${folderPath}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Błąd Directory: ${res.status}`);
    return await res.json();
}

export async function createDirectory(token: string, folderPath: string = "") {

    const res = await fetch(`/api/Directory/CreateFolder?FolderPath=${folderPath}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Błąd Directory: ${res.status}`);
    return await res;
}
// Upload encrypted blob (blob already contains IV as prefix; backend just stores file)
// filename is optional; pass original name if you want backend to store it
export async function uploadEncryptedFilePrefixed(token: string, encryptedBlob: Blob, filename?: string, currentPath : string) {
    const form = new FormData()
    form.append('file', encryptedBlob, filename || 'file.enc')
    if (filename) form.append('originalFilename', filename)
    const res = await fetch(`/api/File/upload?FilePath=${currentPath}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        credentials: 'include',
    })
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