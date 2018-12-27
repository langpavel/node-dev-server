# dev-server

Serving static files and directory indexes for you

## Install

```
$ npm install dev-server -g
```

## Run

```
$ =4000 DEV_SERVER_ROOT=. dev-server
```

### Environment Variables

- `DEV_SERVER_PORT` — port to listen, default 4000
- `DEV_SERVER_ROOT` — root directory

### Special files

File `dev-server-hooks.js` or `.dev-server-hooks.js` is loaded
on start and called with express app instance
