[![Build Status](https://travis-ci.org/abernier/uest.svg?branch=master)](https://travis-ci.org/abernier/uest)
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
req.uest(options)
  .then(resp => {})
  .catch(err => {})
```

- `options` -- are the same as [request/request](https://github.com/request/request#requestoptions-callback), with defaults to `json: true` and `baseUrl` to the same as your Express server.
- `resp` -- the response object, see: [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
- `err` -- when an error occurs or `resp.statusCode >= 400`, see: [http.ClientRequest](http://nodejs.org/api/http.html#http_class_http_clientrequest)

NB: **`resp.body`** holds the JSON response datas
NB: **`err.status`** holds the response statusCode, for example: `404` or `409`...

You can also use it with `await`:

```js
const resp = await req.uest(options).catch(err => {})
```

Or with plain-old [error-first callback](https://nodejs.org/api/errors.html#errors_error_first_callbacks):

```js
req.uest(options, (err, resp, body) => {})
```

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
  })
    .then(resp => {
      // `resp.body` holds JSON response
      console.log('User-session created for', resp.body.user)

      // `req.session` is up-to-date
      console.log(`Welcome back ${req.session.user.firstname}!`
      
      res.redirect('/profile')
    })
    .catch(err => {
      // handle `err`
      next(err)
    })
  ;
});
```

Or another example, with `await` elegance:

```js
app.post('/signup', async (req, res, next) => {
  const {email, password} = req.body

  // 1st subrequest: check user does not already exist
  await req.uest({
    method: 'HEAD',
    url: `/api/users?email=${email}`
  }).catch(err => {
    if (err.status === 409) {
      res.render('signup', {error: 'Email already exist'})
      return
    }

    next(err)
  })

  // 2nd subrequest: create the user
  const {body: user} = await req.uest({
    method: 'POST',
    url: `/api/users`,
    body: {email, password}
  }).catch(next)

  res.redirect('/profile')
});
```
