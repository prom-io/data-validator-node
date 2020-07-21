# API Types

## Table of contents

- [FileMetadata](#filemetadata)
- [FileResponse](#fileresponse)
- [DataOwnerResponse](#dataownerresponse)
- [DataOwnersOfDataValidatorResponse](#dataownersofdatavalidatorresponse)
- [BalanceResponse](#balanceresponse)
- [BalancesResponse](#balancesresponse)

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
