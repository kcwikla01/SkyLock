// Proste szyfrowanie/odszyfrowanie AES-GCM używając Keycloak id (sub) jako klucza.
// IV (12 bytes) jest losowe i jest dołączane jako prefiks do ciphertext:
// stored = [iv (12)] + [ciphertext]

const enc = new TextEncoder()

function getRandomBytes(n: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(n))
}

function bufToBase64(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuf(b64: string): Uint8Array {
    const binary = atob(b64)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return arr
}

// Deterministyczna derivacja klucza: SHA-256(sub) -> import jako AES-GCM key
async function deriveKeyFromSub(sub: string): Promise<CryptoKey> {
    const subBytes = enc.encode(sub)
    const hash = await window.crypto.subtle.digest('SHA-256', subBytes) // 32 bytes
    return window.crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

// Zaszyfruj plik, zwróć Blob, który ma w sobie IV jako prefiks: [iv(12)] + ciphertext
export async function encryptFilePrefixedIV(file: File, sub: string) {
    const key = await deriveKeyFromSub(sub)
    const plainAb = await file.arrayBuffer()
    const iv = getRandomBytes(12)
    const cipherBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainAb)
    const ivArr = iv
    const cipherArr = new Uint8Array(cipherBuf)
    const out = new Uint8Array(ivArr.length + cipherArr.length)
    out.set(ivArr, 0)
    out.set(cipherArr, ivArr.length)
    const blob = new Blob([out.buffer], { type: file.type || 'application/octet-stream' })
    return { blob, length: out.length }
}

// Odszyfruj Blob, który ma prefiks IV: [iv(12)] + ciphertext
// Zwraca ArrayBuffer z plaintextem
export async function decryptPrefixedIVBlobToArrayBuffer(blob: Blob, sub: string) {
    const key = await deriveKeyFromSub(sub)
    const ab = await blob.arrayBuffer()
    const arr = new Uint8Array(ab)
    if (arr.length < 13) throw new Error('Za krótki buffer (brak IV/ciphertext)')
    const iv = arr.slice(0, 12)
    const cipher = arr.slice(12).buffer
    const plainBuf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return plainBuf // ArrayBuffer
}

export { bufToBase64, base64ToBuf }