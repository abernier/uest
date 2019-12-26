const tap = require('tap');
const request = require('request');

const express = require('express');
const session = require('express-session');

const uest = require('../src/index.js');

let app;

const HOST = 'http://localhost:3033';

// ######  ######## ######## ##     ## ########  
// ##    ## ##          ##    ##     ## ##     ## 
// ##       ##          ##    ##     ## ##     ## 
//  ######  ######      ##    ##     ## ########  
//       ## ##          ##    ##     ## ##        
// ##    ## ##          ##    ##     ## ##        
//  ######  ########    ##     #######  ##        

tap.beforeEach(function (done) {
  // console.log('beforeEach')

  //
  // Create an express `app`
  //

	app = express();
  app.start = function (cb) {
    const {port} = require('url').parse(HOST);

    app.server = app.listen(port, er => {
      if (er) return cb(er);
      cb(null);
    });
  };
  app.stop = function (cb) {
    app.server.close(er => {
      if (er) return cb(er);
      cb(null)
    });
  };

  app.use(session({
    secret: "shhhhht"
  }));

  // use our middleware
  app.use(uest());
  
  // Start the server
  app.start(function (er) {
    if (er) return done(er);

    done()
  }) 
})

tap.afterEach(function (done) {
  // console.log('afterEach')

  //
  // Stop the server
  //

	app.stop(function (er) {
    // console.log('app.stop callback')
		if (er) return done(er);

    // clear our `app`
		app = undefined;
		done()
	})
})

// ######   #######   #######  ##    ## #### ########  ######  
// ##    ## ##     ## ##     ## ##   ##   ##  ##       ##    ## 
// ##       ##     ## ##     ## ##  ##    ##  ##       ##       
// ##       ##     ## ##     ## #####     ##  ######    ######  
// ##       ##     ## ##     ## ##  ##    ##  ##             ## 
// ##    ## ##     ## ##     ## ##   ##   ##  ##       ##    ## 
//  ######   #######   #######  ##    ## #### ########  ######  

tap.test('cookies', function (t) {
  t.plan(2)

  const domain = HOST;

  var jar = request.jar();
  var cookie1 = request.cookie('totocook1=toto1'); // initial cookie 1
  var cookie2 = request.cookie('totocook2=toto2'); // initial cookie 2
  jar.setCookie(cookie1, domain);
  jar.setCookie(cookie2, domain);

  app.get('/app-toto', function (req, res, next) {
    //console.log('/app-toto');

    req.session.toto = 'toto';

    // subrequest /app-tata
    req.uest({
      method: 'POST',
      uri: '/app-tata'
    })
      .then((resp, data) => {
        var cookiesStr = res.get('set-cookie').toString();
        t.ok((
          cookiesStr.includes('tatacook1')
          &&
          cookiesStr.includes('tatacook2')
        ), 'Cookies set in the subsequent request /app-tata should have been passed to res');

        res.send()
      })
    ;
  })
  app.post('/app-tata', function (req, res, next) {
    var cookiesStr = req.get('cookie').toString(); // "totocook1=toto1; totocook2=toto2"

    t.ok((
      cookiesStr.includes('totocook1=toto1')
      &&
      cookiesStr.includes('totocook2=toto2')
    ), 'Cookies initially present in /app-toto should have been passed')

    res.cookie('tatacook1', 'tata1')
    res.cookie('tatacook2', 'tata2')

    res.send()
  })

  request({
    method: 'GET',
    uri: `${HOST}/app-toto`,
    jar: jar
  }, function (er, resp, data) {
    t.end()
  });
});

// ######  ########  ######   ######  ####  #######  ##    ## 
// ##    ## ##       ##    ## ##    ##  ##  ##     ## ###   ## 
// ##       ##       ##       ##        ##  ##     ## ####  ## 
//  ######  ######    ######   ######   ##  ##     ## ## ## ## 
//       ## ##             ##       ##  ##  ##     ## ##  #### 
// ##    ## ##       ##    ## ##    ##  ##  ##     ## ##   ### 
//  ######  ########  ######   ######  ####  #######  ##    ## 

tap.test('session', function (t) {
  t.plan(3);

  app.get('/testsession0', function (req, res, next) {
    // console.log('/testsession0', req.headers.cookie);

    req.session.foo = 'FOO';

    res.send();
  })

  app.get('/testsession1', function (req, res, next) {
    // console.log('/testsession1', req.headers.cookie)

    req.session.bar = 'BAR';

    // subrequest
    req.uest({
      method: 'POST',
      uri: '/testsession2'
    }, (er, resp, data) => {
      t.ok(req.session.foo === 'FOO', 'session values set before this request are preserved');
      t.ok(req.session.bar === 'BAR', 'session values set in this request are preserved');
      t.ok(req.session.baz === 'BAZ', 'session values set in req.uest are persisted here');

      res.send();
    })
  })
  app.post('/testsession2', function (req, res, next) {
    // console.log('/testsession2', req.headers.cookie)

    req.session.baz = 'BAZ';

    res.send();
  })

  var jar = request.jar();

  request({
    method: 'GET',
    uri: `${HOST}/testsession0`,
    jar
  }, function (er, resp, data) {
    request({
      method: 'GET',
      uri: `${HOST}/testsession1`,
      jar
    }, function (er, resp, data) {
      t.end()
    });
  });
  
});