import React from 'react'

type Props = {
    name: string;
    onClick: (name: string) => void;
}

export default function FolderTile({ name, onClick }: Props) {
    return (
        <div className="tile" onClick={() => onClick(name)} style={{ cursor: 'pointer' }}>
            <div className="preview-container">
                <div className="icon-wrapper">
                    <i className="bi bi-folder-fill" style={{ color: '#ffc107' }}></i>
                </div>
            </div>
            <span className="file-name" title={name}>
                {name}
            </span>
        </div>
    )
}