export type FileDto = {
    fileId?: string
    FileId?: string
    originalFileName?: string
    OriginalFileName?: string
    storageType?: string
    StorageType?: string
    uploadedAt?: string
    UploadedAt?: string
}

export function getId(f: FileDto): string | undefined {
    return f.fileId ?? f.FileId
}

export function getName(f: FileDto): string {
    return f.originalFileName ?? f.OriginalFileName ?? '(bez nazwy)'
}