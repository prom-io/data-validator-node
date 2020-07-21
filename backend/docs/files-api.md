# Files API

## Tables of content

- [File upload process description](#file-upload-process-description)
  - [Creation of local file on the Data Validator node](#creation-of-local-file-on-the-data-validator-node)
  - [Filling local file with data](#filling-local-file-with-data)
  - [Uploading local file to Service Node](#uploading-local-file-to-service-node)
  - [Check status of uploading file to DDS](#check-status-of-uploading-file-to-dds)
  - [Delete local copy of file from Service Node](#delete-local-copy-of-file-from-service-node)
  - [Sample implementation](#sample-implementation)
- [Create local file](#create-local-file)
- [Upload local file chunk](#upload-local-file-chunk)
- [Upload local file to Service Node](#uploading-local-file-to-service-node)
- [Check file upload status](#check-file-upload-status)
- [Delete local file from Service Node](#delete-local-file-from-service-node)
  

### File upload process description

Uploading file from Data Validator Node to DDS is quite complex process which includes the following steps:

#### Creation of local file on the Data Validator node

On this step, empty file is being created on the Data Validator Node. It gets **local Data Validator file ID**.

#### Filling local file with data 

On this step, empty file is being filled with Base64-encoded data by chunks using previously assigned
**local Data Validator file ID**. File is split in chunks because encoding large file
 (like, several gigabytes of data) in Base64 format at once may cause browser to crash.
 
 #### Uploading local file to Service Node
 
 During this stage file is being uploaded to Service Node. The file gets **local Service Node file ID**
 assigned by Service Node, which we'll need later.
 
 Also, during this stage various file metadata such as file name, size,
 description, hash tags, etc. is supplied to Service Node.
 
 Service node keeps a local copy of the file.
 
 After file has been uploaded to Service Node, the process of uploading file to DDS will be started.
 It will be done **asynchronously**.
 
 #### Check status of uploading file to DDS
 
Because of the asynchronous nature of the previous stage (we don't get the results immediately),
the client should do the regular checks of file uploading status using assigned
**local Service Node file ID**. The response will have the 
following structure:

````
{
    fullyUploaded: boolean, //Whether file has been uploaded to DDS
    failed: boolean, //Whether file uploading failed
    ddsFileId?: string, //ID assigned by DDS
    price?: number, //Price of the file
    storagePrice?: number, //Storage price of the file
    dataOwner?: string, //Created data owner account
    privateKey?: string //Private key of data owner account
}
````

The response will always contain `fullyUploaded` and `failed` fields.

If file has been uploaded successfully, `fullyUpdated` field will be set to `true`
and the response will contain all remaining fields.

If an error occurred during file upload, `failed` field will be set tu `true`. 

#### Delete local copy of file from Service Node

Whether file has been successfully uploaded to DDS or not,
it should be cleaned up from Service Node.


#### Sample implementation

Sample implementation of file uploading can be found in
[sources](https://github.com/Prometeus-Network/data-validator-node/blob/develop/front-end/src/DataUpload/stores/UploadDataStore.ts#L142)
of current Data Validator client.

### Create local file

Creates local file on the data validator node

#### HTTP Request

````
POST /api/v3/files/local
````

#### Response type

Returns an object with the following structure:

````
{
    id: string //ID of locally created file
}
````

### Upload local file chunk

Appends chunk to locally created file

#### HTTP Request

````
POST /api/v3/files/local/:localFileId/chunk
````

#### Request body type

Request body has the following structure: 

````
{
    dataChunk: string // Base64-endcoded data chunk
}
````

#### Response type

Returns an empty response

### Upload local file to Service Node

Uploads locally created file to Service Node

#### HTTP Request

````
POST /api/v3/files/local/:localFileId/to-service-node
````

#### Request body type

````
{
    keepUntil: string, //ISO-formatted date string which indicates how long file must be stored
    name: string, //Name of the file
    mimeType: string, //Mime type of the file
    size: number, //Size of the file in bytes
    dataValidatorAddress: string, //ETH address of data validator who owns the file
    price: number //Price of the file,
    additional: {
        briefDescription?: string, //Brief description of the file,
        fullDescription?: string, //Full description of the file
        hashTags?: string[], //Hash tags of the file
        author?: string, //Author of the file
        userComment?: string //Comment to the file
    }
}
````

#### Response type

Returns [ServiceNodeFileResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#servicenodefileresponse) object

### Check file upload status

Checks status of uploading file to DDS

#### HTTP Request

````
GET /api/v3/files/:serviceNodeFileId/status
````

#### Response type

Returns [FileUploadStatusResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#fileuploadstatusresponse) object where key is wallet address and value is its balance

### Delete local file from Service Node

Deletes local copy of file from Service Node

#### HTTP Request

````
DELETE /api/v3/files/service-node/:serviceNodeFileId
````

#### Response type

Returns an empty response
