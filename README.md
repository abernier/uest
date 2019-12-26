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
- req.session reloading (cf. L.15)

## Install

```
$ npm install req.uest
```

```js
const uest = require('req.uest')
app.use(uest());
```

uest( [name='uest'], [defaults={}] )

NB: `uest` can receive any request.defaults

NB : `uest()` can decorate req in the way you like :

```
app.use(uest('api1', {
  baseUrl: 'http://localhost:3000/api/1.0'
}));

app.use(uest('api2', {
  baseUrl: 'http://localhost:3000/api/2.0'
}));
...

req.api1({...})
req.api2({...})
```