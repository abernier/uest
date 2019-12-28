
const {promisify} = require('util');
const defaults = require('lodash.defaults');

const request = require('request');

module.exports = function (settings={}) {
  return function (req, res, next) {
    const baseUrl = `${req.protocol}://${req.get('Host')}`; // http://localhost:3000
    // console.log('baseUrl=', baseUrl)

    //
    // A jar of cookies for subsequent requests (subsequent to initial req request)
    //

    const jar = request.jar();

    const cookies = req.headers && req.headers.cookie && req.headers.cookie.split(/\s*;\s*/);
    //console.log('req.headers.cookie', cookies);
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

    function uest(options, cb) {
      defaults(options, {
        baseUrl,
        json: true,
        jar: jar,
        headers: {"X-Requested-With": "req.uest"}
      })
      // console.log('options=', options)

      // if (options.method !== 'HEAD') {
      //   options.body = extend({}, req.params, req.body, req.query, options.body);
      // }

      //
      // 1. Persist session before req.uest (that way, the next request will have up-to-date req.session)
      //

      if (req.session && req.session.id && req.session.save) {
        req.session.save(err => {
          if (err) {
            console.log('Error while saving session', err);
            //return cb(err);
          }

          thenSessionSaved()
        });
      } else {
        thenSessionSaved()
      }

      function thenSessionSaved() {
        //
        // 2. Make the request
        //

        //console.log('req.uest options', JSON.stringify(options, null, 4));
        request(options, function (er, resp, data) {
          //
          // Normalize error
          //
          if (er || resp && resp.statusCode >= 400 || data && data.error) {
            const message = data && data.message || resp && resp.statusMessage;
            const status = data && data.status || resp && resp.statusCode;
            // const error = data && data.error;
            // const stack = data && data.stack;

            //console.log('uest cb', require('util').inspect(data));
            er || (er = new Error(message));
            er.status || (er.status = status);
            // er.error || (er.error = error);
            // er.stack || (er.stack = stack);
          }

          //
          // 3.1 Copy/forward cookies set by req.uest to res (append)
          //

          resp && resp.headers && resp.headers['set-cookie'] && resp.headers['set-cookie'].forEach(function (cookie, index) {
            res.cookie(cookie);
          });

          //
          // 3.2 Reload req.session (from session-store) since our last req.uest might have modified it (and req.session is not up-to-date)
          //

          if (req.session && req.session.id && req.session.reload) {
            // console.log('Reloading session of id %s', req.session.id);
            req.session.reload(function (err) {
              if (err) {
                console.log('Error while reloading session', err);
              }

              thenSessionReloaded();
            });
            
          } else {
            thenSessionReloaded();
          }

          function thenSessionReloaded() {
            // console.log('SESSION AFTER RELOAD=', req.session);

            cb(er, resp, data);
          }

        });
      }
      
    }

    // Decorate req
    // req.uest = uest;
    req.uest = promisify(uest);

    next();
  };
};