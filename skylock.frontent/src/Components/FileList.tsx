// FileList.tsx
import React, { useRef, useState, useEffect } from 'react'
import { FileDto, getId, getName } from '../types'
import FileTile from '../Components/FileTile'
import { decryptPrefixedIVBlobToArrayBuffer, createThumbnail } from '../utils/cryptoUtils'

type Props = {
    files: FileDto[];
    busyId: string | null;
    busyUpload: boolean;
    sub: string;
    onDownload: (f: FileDto) => void;
    onDelete: (f: FileDto) => void;
    onUpload: (file: File) => void;
};

export default function FileList({ files, busyId, busyUpload, sub, onDownload, onDelete, onUpload }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

    const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(name);

    useEffect(() => {
        files.forEach(async (f) => {
            const id = getId(f);
            const name = getName(f);

            // Jeśli to obraz i nie mamy jeszcze miniatury
            if (id && isImage(name) && !thumbnails[id]) {
                try {
                    // UWAGA: Musisz pobrać plik z serwera jako Blob
                    // Podmień poniższy adres na Twój endpoint API
                    const response = await fetch(`/api/files/download/${id}`);
                    const encryptedBlob = await response.blob();

                    // Odszyfrowanie
                    const plainAb = await decryptPrefixedIVBlobToArrayBuffer(encryptedBlob, sub);

                    // Tworzenie miniatury (Base64)
                    const thumbData = await createThumbnail(plainAb, "image/jpeg");

                    setThumbnails(prev => ({ ...prev, [id]: thumbData }));
                } catch (err) {
                    console.error("Błąd miniatury dla " + name, err);
                }
            }
        });
    }, [files, sub]);

    return (
        <section className="card">
            <div className="card-header-row">
                <h2>Twoje pliki</h2>
                <div className="card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={busyUpload}>
                        {busyUpload ? 'Wysyłanie…' : 'Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file);
                        e.target.value = '';
                    }} style={{ display: 'none' }} />
                </div>
            </div>

            <div className="tiles">
                {files.map((f, i) => {
                    const id = getId(f) ?? String(i);
                    const name = getName(f);
                    return (
                        <FileTile
                            key={id}
                            file={f}
                            id={id}
                            name={name}
                            isBusy={busyId === id}
                            thumbnailUrl={thumbnails[id]} // Jeśli tu jest URL, pokaże obrazek
                            onDownload={onDownload}
                            onDelete={onDelete}
                        />
                    );
                })}
            </div>
        </section>
    );
}