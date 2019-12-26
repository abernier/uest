[![Build Status](https://travis-ci.org/abernier/uest.svg?branch=master)](https://travis-ci.org/abernier/uest)

`req.uest` is an Express middleware that allows you to request another route within a route :

```js
// Mount our API router
app.use('/api', require('./routers/api'));

//
// App routing
//

app.post('/login', (req, res, next) => {
  req.uest({
    method: 'POST',
    url: /api/sessions,
    body: {username, password}
  })
    .then((resp, data) => {
      console.log(`Welcome back ${req.session.user.firstname}!`;
      res.redirect('/profile');
    })
    .catch(err => {
      // handle err
    })
  ;
});
```

## Advantages

It allows you to decouple your app's routes from your API,s ones. IOW, your app routes can now consume your API as any client.

TODO: schema clients <-> API

## Features

- 🍪 jar: incoming cookies (from `req`) are passed for subsequent `req.uest`s
- cookies forwarding: cookies set by `req.uest`s responses are forwarded to `res`
- `req.session` stay in sync between requests

## Install

```
$ npm install req.uest
```

```js
const uest = require('req.uest')
app.use(uest());
```

## Usage

Syntax is:

```
req.uest(options)
  .then((resp, data))
  .catch(err)
```

- `options` are the same as [request/request](https://github.com/request/request#requestoptions-callback)
- `catch` is triggered when an error occurs or `resp.statusCode >= 400`