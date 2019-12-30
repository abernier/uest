[![Build Status](https://github.com/abernier/uest/workflows/ci/cd/badge.svg)](https://github.com/abernier/uest/actions?query=workflow%3Aci%2Fcd)
[![NPM version](https://img.shields.io/npm/v/uest.svg?style=flat)](https://www.npmjs.com/package/uest)
![David](https://img.shields.io/david/abernier/uest)
[![Coveralls github](https://img.shields.io/coveralls/github/abernier/uest)](https://coveralls.io/github/abernier/uest)

`req.uest` is an Express middleware that allows you, from a given route, to request another route.

Features are:
- Initial `req` cookies are passed along to subsequent `req.uest`s
- Cookies set by `req.uest`s responses are forwarded to `res`
- `req.session` stay in sync between requests

It allows you to decouple your app's routes from your API's ones. IOW, your app routes can now consume your API as any client.

## Install

```
$ npm i uest
```

```js
// app.js

const uest = require('uest')

app.use(uest())
```

## Usage

```js
req.uest(options, (er, resp, body) => {})
```

- `options` -- are the same as [request/request](https://github.com/request/request#requestoptions-callback), with defaults to `json: true` and `baseUrl` to the same as your Express server.
- `resp` -- the response object, see: [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - **`resp.body`** holds the JSON response datas
- `er` -- when an error occurs or `resp.statusCode >= 400`, see: [http.ClientRequest](http://nodejs.org/api/http.html#http_class_http_clientrequest)
  - **`er.status`** holds the response statusCode, for example: `404` or `409`...

## Example

```js
// Mount our API router
app.use('/api', require('./routers/api'));

//
// App routing
//

app.post('/login', (req, res, next) => {
  const {email, password} = req.body

  //
  // Our subsequent request to `POST /api/sessions` route
  //

  req.uest({
    method: 'POST',
    url: '/api/sessions',
    body: {email, password}
  }, (er, resp, body) => {
    if (er) {
      // Deal with specific "Forbidden" error
      if (er.status === 403) {
        return res.render('login', {error: "Wrong login/password"})
      }

      return next(er); // for any other error
    }

    console.log('User-session created for', body.user)

    // `req.session` is up-to-date
    console.log(`Welcome back ${req.session.user.firstname}!`
      
    res.redirect('/profile')
  })
});
```