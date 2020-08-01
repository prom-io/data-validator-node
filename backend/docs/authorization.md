# Authorization API

## Table of contents

- [Get access token](#get-access-token)

### Get access token

Returns JWT access token

#### HTTP Request

````
POST /api/v3/auth/login
````

#### Request body type

````
{
    username: string,
    password: string
}
````

#### Response body type

Returns [AccessTokenResponse](https://github.com/Prometeus-Network/data-validator-node/blob/develop/backend/docs/api-types.md#accesstokenresponse) object
