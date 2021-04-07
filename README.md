# dev-server

Serving static files and directory indexes for you

## Quick usage
```
$ npx dev-server
```

## Install

```
$ npm install dev-server -g
```

## Run

```
$ DEV_SERVER_PORT=4000 DEV_SERVER_ROOT=. dev-server
```

### Environment Variables

- `DEV_SERVER_PORT` — port to listen, default 4000
- `DEV_SERVER_ROOT` — root directory

### Special files

File `dev-server-hooks.js` or `.dev-server-hooks.js` is loaded
on start and called with express app instance
