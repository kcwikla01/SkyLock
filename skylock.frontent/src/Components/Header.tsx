import React from 'react'

type Props = {
    authenticated: boolean
    displayName: string
    onLogout: () => void
}

export default function Header({ authenticated, displayName, onLogout }: Props) {
    return (
        <>
            {authenticated && (
                <div className="top-greeting">
                    <div className="hello">
                        Witaj, <span className="nick">{displayName}</span>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                        Wyloguj
                    </button>
                </div>
            )}

            <header className="header">
                <h1>Skylock</h1>
                <p className="subtitle">Cloud-based multimedia service</p>
            </header>
        </>
    )
}