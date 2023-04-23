Chocolate is a simple streaming solution ships with authorization.

## Deploy
see [`deploy/README.md`](https://github.com/sheey11/chocolate/tree/master/deploy)

## Usage
After bringing up all containters, send a `POST` request to server to create the very first admin account.

```console
$ curl --request POST \
  --url http://localhost/api/v1/admin/init \
  --header 'content-type: application/json' \
  --data '{
  "username": "sheey",
  "password": "your-favorite-password"
}'
```

Then navigate to `http://localhost/signin` to get started with Chocolate.

## license

GPLv3.