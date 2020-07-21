# Transactions API

## Table of contents

- [Get transactions of Data Validator](#get-transactions-of-data-validator)

### Get transactions of Data Validator

Returns list of transactions of Data Validator account with the specified address

#### HTTP Request

````
GET /api/v3/transactions?address=${address}&page=${page}&pageSize=${pageSize}&type=${type}
````

`address` parameter is required.

`page`, `pageSize` and `type` parameters are optional. Pagination starts with `0`.

`type` parameter can have the following values: 

- `dataUpload`
- `dataPurchase`

#### Response type

Returns array of [TransactionResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#transactionresponse)
 objects.
