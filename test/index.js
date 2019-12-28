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

// ######   ######## ##    ## ######## ########     ###    ##       
// ##    ##  ##       ###   ## ##       ##     ##   ## ##   ##       
// ##        ##       ####  ## ##       ##     ##  ##   ##  ##       
// ##   #### ######   ## ## ## ######   ########  ##     ## ##       
// ##    ##  ##       ##  #### ##       ##   ##   ######### ##       
// ##    ##  ##       ##   ### ##       ##    ##  ##     ## ##       
//  ######   ######## ##    ## ######## ##     ## ##     ## ######## 

tap.test('error-first callback', t => {
  t.plan(1)

  app.get('/toto', (req, res, next) => {
    req.uest(
      {method: 'POST', url: '/tata'},
      (er, resp, body) => {
        t.ok(body.ok === 'tata', 'Error-first callback')
        res.send()
      }
    )
  })

  app.post('/tata', (req, res, next) => {
    res.json({ok: 'tata'})
  })

  request({
    method: 'GET',
    uri: `${HOST}/toto`
  }, function (er, resp, body) {
    t.end()
  });
})

tap.test('Promise call', t => {
  t.plan(1)

  app.get('/toto', (req, res, next) => {
    req.uest({method: 'POST', url: '/tata'})
      .then(({body}) => {
        t.ok(body.ok === 'tata', 'Promise call')
        res.send()
      })
      .catch(next)
  })

  app.post('/tata', (req, res, next) => {
    res.json({ok: 'tata'})
  })

  request({
    method: 'GET',
    uri: `${HOST}/toto`
  }, function (er, resp, body) {
    t.end()
  });
})

tap.test('await call', t => {
  t.plan(1)

  app.get('/toto', async (req, res, next) => {
    const resp = await req.uest({method: 'POST', url: '/tata'}).catch(next)

    t.ok(resp.body.ok === 'tata', 'await call')
    res.send()
  })

  app.post('/tata', (req, res, next) => {
    res.json({ok: 'tata'})
  })

  request({
    method: 'GET',
    uri: `${HOST}/toto`
  }, function (er, resp, body) {
    t.end()
  });
})

tap.test('err when resp.statusCode > 400', t => {
  t.plan(6)

  app.get('/toto', async (req, res, next) => {
    await req.uest({method: 'POST', url: '/tata1'}).catch(er => {
      t.ok(er instanceof Error, 'er should be an error')
      t.ok(er.message === 'Not Found', 'er.message should be resp.statusMessage')
      t.ok(er.status === 404, 'er.status should be resp.statusCode')
    })

    await req.uest({method: 'POST', url: '/tata2'}).catch(er => {
      t.ok(er instanceof Error, 'er should always be an error')
      t.ok(er.message === 'Nope', 'er.message should be body.message')
      t.ok(er.status === 501, 'er.status should be body.status')
    })

    res.send()
  })
  app.post('/tata1', (req, res, next) => {
    res.status(404).send();
  })
  app.post('/tata2', (req, res, next) => {
    res.status(500).json({
      message: 'Nope',
      status: 501
    });
  })

  request({
    method: 'GET',
    uri: `${HOST}/toto`
  }, function (er, resp, body) {
    t.end()
  });
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

  app.get('/app-toto', function (req, res, next) {
    //console.log('/app-toto');

    // subrequest
    req.uest({
      method: 'POST',
      uri: '/app-tata'
    })
      .then((resp, body) => {
        const cookiesStr = res.get('set-cookie').toString();
        t.ok(
          cookiesStr.includes('tatacook1') && cookiesStr.includes('tatacook2'),
          'Cookies set in the subsequent request /app-tata should have been passed to res'
        );

        res.send()
      })
    ;
  })

  app.post('/app-tata', function (req, res, next) {
    const cookiesStr = req.get('cookie').toString(); // "totocook1=toto1; totocook2=toto2"
    t.ok(
      cookiesStr.includes('totocook1=toto1') && cookiesStr.includes('totocook2=toto2'),
      'Cookies initially present in /app-toto should have been passed'
    );

    res.cookie('tatacook1', 'tata1')
    res.cookie('tatacook2', 'tata2')

    res.send()
  })

  //
  // do initial request
  //

  const domain = HOST;

  const jar = request.jar();
  const cookie1 = request.cookie('totocook1=toto1'); // initial cookie 1
  const cookie2 = request.cookie('totocook2=toto2'); // initial cookie 2
  jar.setCookie(cookie1, domain);
  jar.setCookie(cookie2, domain);

  request({
    method: 'GET',
    uri: `${HOST}/app-toto`,
    jar: jar
  }, function (er, resp, body) {
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
  t.plan(4);

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
    }, (er, resp, body) => {
      // subrequest
      req.uest({
        method: 'POST',
        uri: '/testsession3'
      }, (er, resp, body) => {
        t.ok(req.session.foo === 'FOO', 'session values set before this request are preserved');
        t.ok(req.session.bar === 'BAR', 'session values set in this request are preserved');
        t.ok(req.session.baz === 'BAZ', 'session values set in req.uest are persisted here');
        t.ok(req.session.bang === 'BANG', 'session values set in nested req.uest are also persisted here');

        res.send();
      })
    })
  })
  app.post('/testsession2', function (req, res, next) {
    // console.log('/testsession2', req.headers.cookie)

    req.session.baz = 'BAZ';

    res.send();
  })
  app.post('/testsession3', function (req, res, next) {
    // console.log('/testsession3', req.headers.cookie)

    req.session.bang = 'BANG';

    res.send();
  })

  const jar = request.jar();

  request({
    method: 'GET',
    uri: `${HOST}/testsession0`,
    jar
  }, function (er, resp, body) {
    request({
      method: 'GET',
      uri: `${HOST}/testsession1`,
      jar
    }, function (er, resp, body) {
      t.end()
    });
  });
  
});
