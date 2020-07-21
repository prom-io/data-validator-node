# Accounts API

## Table of contents

- [Get all data validator accounts](#get-all-data-validator-accounts)
- [Create new data validator account](#create-new-data-validator-account)
- [Get data owners of data validator](#get-data-owners-of-data-validator)
- [Get balance of account](#get-balance-of-account)
- [Get balances of all accounts](#get-balances-of-all-accounts)

### Get all data validator accounts

Returns all accounts of this data validator node

#### HTTP Request

````
GET /api/v3/accounts
````

#### Response type

Returns array of [AccountsResponse]

### Create new data validator account

Creates new data validator account

#### HTTP Request

````
POST /api/v3/accounts
````

#### Request body type

````
{
    address: string,
    privateKey: string
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

Returns [DataOwnersOfDataValidatorResponse] object

### Get balance of account

Returns balance of data validator account with the specified balance

#### HTTP Request

````
GET /api/v3/accounts/:address/balance
````

#### Response type

Returns [BalanceResponse] object

### Get balances of all accounts

Returns balances of all data validator accounts registered on this node

#### HTTP Request

````
GET /api/v3/accounts/balances
````

#### Response type

Returns [BalancesResponse] object where key is wallet address and value is its balance

