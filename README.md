Chocolate is a simple streaming solution ships with authentication & authorization.

## Features

- [x] Auccounts.
- [x] Separated Streaming Rooms.
- [x] Blacklists & Whitelists.
- [x] Room censership. e.g. Cutoff
- [x] Chats & History Views.
- [x] Activity Views.
- [x] I18N with English and 简体中文.

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
Then navigate to `http://localhost/signin` to sign in and manage the Chocolate.

You can also get started at `http://localhost/profile` to create your first streaming room.

## License

GPLv3.
