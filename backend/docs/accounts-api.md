# Accounts API

## Table of contents

- [Create new data validator account](#create-new-data-validator-account)
- [Get data owners of data validator](#get-data-owners-of-data-validator)
- [Get current account](#get-current-account)
- [Get balance of current account](#get-balance-of-current-account)

### Create new data validator account

Creates new data validator account

#### HTTP Request

````
POST /api/v3/accounts
````

#### Request body type

````
{
    lambdaWallet: string,
    password: string,
    passwordConfirmation: string
}
````

#### Response type

Returns empty response

### Get data owners of data validator

Returns list of data owner of the specified data validator

#### HTTP Request

````
GET /api/v3/accounts/data-validators/:dataValidatorAddress/data-owners
````

#### Response type

Returns [DataOwnersOfDataValidatorResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#dataownersofdatavalidatorresponse) object

### Get current account

#### HTTP Request

````
GET /api/v1/accounts/current
````

#### Response type

Returns [CurrentAccountResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#currentaccountresponse) object

### Get balance of current account

Returns balance of currently logged in data validator account with the specified balance.
Requires JWT token to be present in headers.

#### HTTP Request

````
GET /api/v3/accounts/current/balance
````

#### Response type

Returns [BalanceResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#balanceresponse) object

