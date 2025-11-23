import React, { useRef } from 'react'
import { FileDto } from '../types'

type Props = {
    files: FileDto[]
    busyId?: string | null
    busyUpload?: boolean
    onDownload: (f: FileDto) => Promise<void> | void
    onDelete: (f: FileDto) => Promise<void> | void
    onUpload: (file: File) => Promise<void> | void
    onNavigate?: (path: string) => void // wywołane gdy klikniesz folder
    onCreateFolder?: () => void // nowy prop: wywołanie tworzenia katalogu
}

export default function FileList({ files, busyId, busyUpload, onDownload, onDelete, onUpload, onNavigate, onCreateFolder }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    // separate directories and files for display order
    const dirs = files.filter((f) => f.isDirectory)
    const regular = files.filter((f) => !f.isDirectory)

    async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.target
        if (!input.files || input.files.length === 0) return
        const file = input.files[0]
        try {
            await onUpload(file)
        } catch (err) {
            console.error('[FileList] upload error', err)
        } finally {
            // clear selection so same file can be selected again later
            input.value = ''
        }
    }

    function openFileDialog() {
        inputRef.current?.click()
    }

    return (
        <section className="card file-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <strong>Folder zawiera:</strong> {dirs.length} katalog(ów), {regular.length} plik(ów)
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        ref={inputRef}
                        style={{ display: 'none' }}
                        type="file"
                        onChange={handleFileInputChange}
                    />
                    <button type="button" onClick={openFileDialog} disabled={!!busyUpload}>
                        {busyUpload ? 'Wysyłanie…' : 'Prześlij plik'}
                    </button>

                    {/* Przycisk utwórz katalog obok upload */}
                    {onCreateFolder && (
                        <button type="button" onClick={onCreateFolder} style={{ marginLeft: 4 }}>
                            Utwórz katalog
                        </button>
                    )}
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Nazwa</th>
                        <th style={{ width: 120, textAlign: 'right', padding: '6px 8px' }}>Rozmiar</th>
                        <th style={{ width: 220, padding: '6px 8px' }}>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {dirs.map((d) => (
                        <tr key={`${d.path || ''}/dir-${d.fileId || d.id || d.originalFileName}`}>
                            <td style={{ padding: '6px 8px' }}>
                                <button
                                    type="button"
                                    onClick={() => onNavigate && onNavigate(d.path || '')}
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0366d6' }}
                                >
                                    📁 {d.originalFileName || (d.path ? d.path.split('/').pop() : 'folder')}
                                </button>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>—</td>
                            <td style={{ padding: '6px 8px' }}>
                                <button type="button" onClick={() => onNavigate && onNavigate(d.path || '')}>Otwórz</button>
                                <button type="button" onClick={() => onDelete(d)} style={{ marginLeft: 8 }}>Usuń</button>
                            </td>
                        </tr>
                    ))}

                    {regular.map((f) => (
                        <tr key={f.fileId}>
                            <td style={{ padding: '6px 8px', wordBreak: 'break-all' }}>{f.originalFileName || f.fileId}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>{f.size != null ? formatSize(f.size) : '—'}</td>
                            <td style={{ padding: '6px 8px' }}>
                                <button type="button" disabled={busyId === getId(f)} onClick={() => onDownload(f)}>
                                    {busyId === getId(f) ? 'Pobieranie…' : 'Pobierz'}
                                </button>
                                <button type="button" onClick={() => onDelete(f)} style={{ marginLeft: 8 }}>Usuń</button>
                            </td>
                        </tr>
                    ))}

                    {files.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ padding: '12px 8px', color: '#666' }}>
                                Brak plików w tym katalogu.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    )
}

function formatSize(bytes?: number) {
    if (bytes == null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getId(f: FileDto) {
    return f.fileId || f.id || ''
}