[![Build Status](https://travis-ci.org/abernier/uest.svg?branch=master)](https://travis-ci.org/abernier/uest)
[![NPM version](https://img.shields.io/npm/v/uest.svg?style=flat)](https://www.npmjs.com/package/uest)
![David](https://img.shields.io/david/abernier/uest)
![Coveralls github](https://img.shields.io/coveralls/github/abernier/uest)

`req.uest` is an Express middleware that allows you, from a given route, to request another route.

## Install

```
$ npm install uest
```

```js
// app.js

const express = express()
const uest = require('uest')

const app = express();

app.use(uest())
```

## Usage

Syntax is:

```
req.uest(options)
  .then((resp, data) => {})
  .catch(err => {})
```

or with error-fisrt callback:

```js
req.uest(options, (err, resp, data) => {})
```

- `options` are the same as [request/request](https://github.com/request/request#requestoptions-callback), with defaults to `json: true` and `baseUrl` to the same as your Express server.
- `err` when an error occurs or `resp.statusCode >= 400`

## Example

```js
// Mount our API router
app.use('/api', require('./routers/api'));

//
// App routing
//

app.post('/login', (req, res, next) => {
  req.uest({
    method: 'POST',
    url: '/api/sessions',
    body: {username, password}
  })
    .then((resp, data) => {
      // data holds json response
      // req.session is up-to-date

      console.log(`Welcome back ${req.session.user.firstname}!`;
      res.redirect('/profile');
    })
    .catch(err => {
      // handle err
    })
  ;
});
```

## Features

- 🍪 jar: incoming cookies (from `req`) are passed to subsequent `req.uest`s
- cookies forwarding: cookies set by `req.uest`s responses are forwarded to `res`
- `req.session` stay in sync between requests

## Advantages

It allows you to decouple your app's routes from your API's ones. IOW, your app routes can now consume your API as any client.

TODO: schema clients <-> API
