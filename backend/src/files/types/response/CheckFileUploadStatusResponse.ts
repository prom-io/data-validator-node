export interface CheckFileUploadStatusResponse {
    fullyUploaded: boolean,
    failedAtStage?: string,
    failed: boolean,
    ddsFileId?: string,
    price?: number,
    dataOwner?: string,
    privateKey?: string
}
