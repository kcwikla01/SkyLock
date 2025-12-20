import React from 'react'
import { FileDto } from '../types'
type Props = {
    file: FileDto
    name: string
    id: string
    isBusy: boolean
    thumbnailUrl?: string
    onDownload: (f: FileDto) => void
    onDelete: (f: FileDto) => void
}

// Funkcja dobierająca ikonę na podstawie rozszerzenia
const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return 'bi-file-earmark-pdf';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp': return 'bi-file-earmark-image'; // Ikona dla obrazów
        case 'zip':
        case 'rar':
        case '7z': return 'bi-file-earmark-zip';
        case 'txt': return 'bi-file-earmark-text';
        case 'mp4':
        case 'mov': return 'bi-file-earmark-play';
        default: return 'bi-file-earmark'; // Domyślna ikona
    }
};

export default function FileTile({ file, name, id, isBusy, thumbnailUrl, onDownload, onDelete }: Props) {
    return (
        <div className="tile">
            <div className="preview-container">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="" className="img-fit" />
                ) : (
                    <div className="icon-wrapper">
                        {/* Wyświetlamy ikonę, jeśli nie ma jeszcze miniaturki */}
                        <i className={`bi ${getFileIcon(name)}`}></i>
                    </div>
                )}
            </div>

            <span className="file-name" title={name}>{name}</span>

            <div className="actions">
                <button type="button" className="icon-btn" disabled={isBusy} onClick={() => onDownload(file)}>
                    <i className="bi bi-download"></i>
                </button>
                <button type="button" className="icon-btn danger" disabled={isBusy} onClick={() => onDelete(file)}>
                    <i className="bi bi-trash"></i>
                </button>
            </div>
        </div>
    )
}