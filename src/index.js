
const {promisify} = require('util');
const defaults = require('lodash.defaults');
//const extend = require('lodash.assignin');

/*
const uest = require('uest')
app.use(uest({
  baseUrl: 'http://localhost:3000'
}))

...

app.post('/api/sessions', (req, res, next) => {
  const {username, password} = req.body;

  User.findOne({username})
    .then(user => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        const err = new Error(); err.status = 403;
        return next(err);
      }

      req.session.user = user; // Save the user in the session!
      res.json(user);
    })
    .catch(next)
  ;
})

app.get('/login', (req, res, next) => {
  req.uest({
    method: 'POST'
    url: '/api/sessions',
    body: {
      username: 'abernier'
      password: 'blacky123'
    }
  }).then((resp, data) => {
    res.send(`Welcome back ${req.session.user.username}!`)
  }).catch(next)
})
*/

module.exports = function (settings={}) {
  return function (req, res, next) {
    const baseUrl = `${req.protocol}://${req.get('Host')}`; // http://localhost:3000

    //
    // A jar of cookies for subsequent requests (subsequent to initial req request)
    //

    const jar = require('request').jar();

    // Initially filled with req cookies
    const cookies = req.headers && req.headers.cookie && req.headers.cookie.split('; ');
    if (cookies && cookies.length) {
      cookies.forEach(function (cookieStr) {
        //console.log('putting cookie "%s" into jar', cookieStr);

        jar.setCookie(cookieStr, baseUrl);
      });
    }
    //console.log('jar', require('util').inspect(jar));

    //
    //
    //

    defaults(settings, {
      baseUrl,
      json: true,
      jar,
      headers: {"X-Requested-With": "req.uest"}
    });
    const request = require('request').defaults(settings);

    function uest(options, cb) {
      // if (options.method !== 'HEAD') {
      //   options.body = extend({}, req.params, req.body, req.query, options.body);
      // }

      //
      // Make the request
      //

      //console.log('req.uest options', JSON.stringify(options, null, 4));
      request(options, function (er, resp, data) {
        //
        // Normalize error
        //
        if (er || resp && resp.statusCode >= 400 || data && data.error) {
          const message = data && data.message || resp && resp.statusMessage;
          const status = data && data.status || resp && resp.statusCode;
          const error = data && data.error;
          const stack = data && data.stack;

          //console.log('uest cb', require('util').inspect(data));
          er || (er = new Error(message));
          er.status || (er.status = status);
          er.error || (er.error = error);
          er.stack || (er.stack = stack);
        }

        //
        // Copy/forward cookies set by req.uest to res (append)
        //

        resp && resp.headers && resp.headers['set-cookie'] && resp.headers['set-cookie'].forEach(function (cookie, index) {
          res.cookie(cookie);
        });

        //
        // Reload req.session (from session-store) since our last req.uest might have modified it (and req.session is not up-to-date)
        //

        if (req.session && req.session.id && req.session.reload) {
          //console.log('Reloading session of id %s', req.session.id);

          req.session.reload(function (err) {
            if (err) return cb(err);
            //console.log('Session reloaded %s', req.session.id, JSON.stringify(req.session, null, 4));

            thenSessionReloaded();
          });
        } else {
          thenSessionReloaded();
        }

        function thenSessionReloaded() {
          cb(er, resp, data);
        }

      });
    }

    // Decorate req
    // req.uest = uest;
    req.uest = promisify(uest);
    

    next();
  };
};