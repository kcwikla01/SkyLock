// FileList.tsx
import React, { useRef, useState, useEffect } from 'react'
import { FileDto, getId, getName } from '../types'
import FileTile from '../Components/FileTile'
import FolderTile from '../Components/FolderTile'
import { decryptPrefixedIVBlobToArrayBuffer, createThumbnail } from '../utils/cryptoUtils'

type Props = {
    files: FileDto[];
    busyId: string | null;
    busyUpload: boolean;
    sub: string;
    onDownload: (f: FileDto) => void;
    onDelete: (f: FileDto) => void;
    onUpload: (file: File) => void;
    directories: string[];
    currentPath: string;
    onFolderClick: (name: string) => void;
    onBack: () => void;
    onCreateFolder: () => void;
};

export default function FileList({ files, busyId, busyUpload, sub, onDownload, onDelete, onUpload, directories = [], currentPath = "\\", onFolderClick, onBack, onCreateFolder }: Props) {
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
                    <button
                        className="btn btn-primary btn-sm"
                        title="StworzFolder"
                        onClick={onCreateFolder}
                    >
                        <i className="bi bi-folder-plus"></i> {/* To jest ikonka Folderu */}
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        title="Wróć wyżej"
                        onClick={onBack}
                    >
                        <i className="bi bi-arrow-left"></i> {/* To jest ikonka strzałki */}
                    </button>
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
                <div style={{
                    gridColumn: '1 / -1', // Rozciąga napis na całą szerokość grida
                    textAlign: 'center',
                    padding: '10px 0',
                    marginBottom: '10px',
                    fontSize: '1.2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <strong style={{ color: '#888' }}>Ścieżka:</strong>
                    <span style={{ color: '#ffc107', marginLeft: '10px' }}>
                        {currentPath === "" ? "/" : `/${currentPath}`}
                    </span>
                </div>

                {directories.map((dirName, i) => (
                    <FolderTile
                        key={`folder-${i}`}
                        name={dirName}
                        onClick={onFolderClick} // Przekazujemy funkcję do kafelka
                    />
                ))}

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