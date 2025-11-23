import React, { useRef } from 'react'
import { FileDto, getId, getName } from '../types'
import FileTile from './FileTile'

type Props = {
    files: FileDto[]
    busyId: string | null
    busyUpload: boolean
    onDownload: (f: FileDto) => void
    onDelete: (f: FileDto) => void
    onUpload: (file: File) => void
}

export default function FileList({ files, busyId, busyUpload, onDownload, onDelete, onUpload }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    function openFilePicker() {
        fileInputRef.current?.click()
    }

    function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        onUpload(file)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <section className="card">
            <div className="card-header-row">
                <h2 className="text-center">Twoje pliki :</h2>
                <div className="card-actions">
                    <button className="btn btn-primary btn-sm" onClick={openFilePicker} disabled={busyUpload}>
                        {busyUpload ? 'Wysyłanie…' : 'Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" onChange={onFilePicked} style={{ display: 'none' }} />
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
                            <FileTile key={id} file={f} id={id} name={name} isBusy={isBusy} onDownload={onDownload} onDelete={onDelete} />
                        )
                    })}
                </div>
            )}
        </section>
    )
}