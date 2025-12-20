// cryptoUtils.ts
const enc = new TextEncoder()

function getRandomBytes(n: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(n))
}

async function deriveKeyFromSub(sub: string): Promise<CryptoKey> {
    const subBytes = enc.encode(sub)
    const hash = await window.crypto.subtle.digest('SHA-256', subBytes)
    return window.crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptFilePrefixedIV(file: File, sub: string) {
    const key = await deriveKeyFromSub(sub)
    const plainAb = await file.arrayBuffer()
    const iv = getRandomBytes(12)
    const cipherBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainAb)
    const out = new Uint8Array(iv.length + cipherBuf.byteLength)
    out.set(iv, 0)
    out.set(new Uint8Array(cipherBuf), iv.length)
    const blob = new Blob([out.buffer], { type: file.type || 'application/octet-stream' })
    return { blob, length: out.length }
}

export async function decryptPrefixedIVBlobToArrayBuffer(blob: Blob, sub: string) {
    const key = await deriveKeyFromSub(sub)
    const ab = await blob.arrayBuffer()
    const arr = new Uint8Array(ab)
    if (arr.length < 13) throw new Error('Za krótki buffer')
    const iv = arr.slice(0, 12)
    const cipher = arr.slice(12).buffer
    return await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
}

// Funkcja tworząca lekką miniaturkę przy użyciu Canvas
export async function createThumbnail(plainAb: ArrayBuffer, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([plainAb], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 150;
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url); // Czyścimy duży obrazek z pamięci
            resolve(canvas.toDataURL('image/webp', 0.7)); // Zwracamy mały Base64
        };
        img.onerror = reject;
        img.src = url;
    });
}