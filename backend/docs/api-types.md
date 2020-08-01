# API Types

## Table of contents

- [AccountResponse](#accountresponse)
- [FileMetadata](#filemetadata)
- [FileResponse](#fileresponse)
- [DataOwnerResponse](#dataownerresponse)
- [DataOwnersOfDataValidatorResponse](#dataownersofdatavalidatorresponse)
- [BalanceResponse](#balanceresponse)
- [BalancesResponse](#balancesresponse)
- [ServiceNodeFileResponse](#servicenodefileresponse)
- [FileUploadStatusResponse](#fileuploadstatusresponse)
- [TransactionResponse](#transactionresponse)
- [CurrentAccountResponse](#currentaccountresponse)
- [AccessTokenResponse](#accesstokenresponse)

### AccountResponse

````
{
    address: string
}
````

### FileMetadata

````
{
    briefDescription?: string,
    fullDescription?: string,
    hashTags?: string[],
    author?: string,
    userComment?: string
}
````

### FileResponse

````
{
    id: string,
    createdAt: string,
    keepUntil: string,
    extension: string,
    mimeType: string,
    size: number,
    price: number,
    fileMetadata: FileMetadata    
}
````

### DataOwnerResponse

````
{
    address: string,
    privateKey: string,
    dataValidatorAddress: string,
    file: FileResponse
}
````

### DataOwnersOfDataValidatorResponse

````
{
    dataOwners: DataOwnerResponse[]
}
````

### BalanceResponse

````
{
    balance: number
}
````

### BalancesResponse

````
{
    [address: string]: number
}
````

### ServiceNodeFileResponse

````
{
    id: string, //ID assigned by Service Node
    name: string,
    extension: string,
    mimeType: string,
    size: number,
    metadata: FileMetadata,
    deletedLocally: boolean
}
````

### FileUploadStatusResponse

````
{
    fullyUploaded: boolean, //Whether file has been uploaded to DDS
    failed: boolean, //Whether file uploading failed
    ddsFileId?: string, //ID assigned by DDS
    price?: number, //Price of the file
    dataOwner?: string, //Created data owner account
    privateKey?: string //Private key of the file
}
````

### TransactionResponse

````
{
    dataMart?: string,
    sum: number,
    dataOwner: DataOwnerResponse,
    file: FileResponse,
    hash: string,
    createdAt: string,
    type: "dataUpload" | "dataPurchase",
    serviceNode: string
}
````

### CurrentAccountResponse

````
{
    lambdaAddress: string,
    ethereumAddress: string
}
````

### AccessTokenResponse 

````
{
    accessToken: string
}
````
