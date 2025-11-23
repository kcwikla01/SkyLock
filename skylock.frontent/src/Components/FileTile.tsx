import React from 'react'
import { FileDto } from '../types'

type Props = {
    file: FileDto
    name: string
    id: string
    isBusy: boolean
    onDownload: (f: FileDto) => void
    onDelete: (f: FileDto) => void
}

export default function FileTile({ file, name, id, isBusy, onDownload, onDelete }: Props) {
    return (
        <div className="tile">
            <div className="name" title={name}>
                {name}
            </div>
            <div className="actions">
                <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Pobierz ${name}`}
                    disabled={isBusy}
                    onClick={() => void onDownload(file)}
                >
                    <i className="bi bi-download"></i>
                </button>
                <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Usuń ${name}`}
                    disabled={isBusy}
                    onClick={() => void onDelete(file)}
                >
                    <i className="bi bi-trash"></i>
                </button>
            </div>
        </div>
    )
}