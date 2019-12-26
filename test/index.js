const tap = require('tap');
const express = require('express');
const request = require('request');

const uest = require('../src/index.js');

function reqq(options, cb) {  
  return request(options, function (er, resp, data) {
    // Normalize error
    if (er || resp && resp.statusCode >= 400 || data && data.error) {
      er || (er = new Error(data && data.message || resp && resp.statusMessage));
      er.status || (er.status = data && data.status || resp && resp.statusCode);
      er.error || (er.error = data && data.error);
      er.stack || (er.stack = data && data.stack);
    }
    
    cb(er, resp, data);
  });
}

let app;

tap.beforeEach(function (done) {
  console.log('beforeEach')

  //
  // Create an express `app`
  //

	app = express();
  app.start = function (cb) {
    app.server = app.listen(3000, er => {
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

  // use our middleware
  app.use(uest());
  
  // Start the server
  app.start(function (er) {
    if (er) return done(er);

    done()
  }) 
})

tap.afterEach(function (done) {
  console.log('afterEach')

  //
  // Stop the server
  //

	app.stop(function (er) {
    console.log('app.stop callback')
		if (er) return done(er);

    // clear our `app`
		app = undefined;
		done()
	})
})


tap.test('cookies', function (t) {
  const domain = 'http://localhost:3000';

  var jar = request.jar();
  var cookie1 = request.cookie('totocook1=toto1'); // initial cookie 1
  var cookie2 = request.cookie('totocook2=toto2'); // initial cookie 2
  jar.setCookie(cookie1, domain);
  jar.setCookie(cookie2, domain);

  app.get('/app-toto', function (req, res, next) {
    console.log('/app-toto');

    // subrequest /app-tata
    req.uest({
      method: 'POST',
      uri: '/app-tata'
    })
      .then((resp, data) => {
        t.ok(201 === resp.statusCode, '/app-tata returns a 201');
        t.ok(JSON.toString({yes: 'oktata'}) === JSON.toString(data), '/app-tata returns expected json value');

        var cookiesStr = res.get('set-cookie').toString();
        t.ok((
          cookiesStr.includes('tatacook1')
          &&
          cookiesStr.includes('tatacook2')
        ), 'Cookies set in the subsequent request /app-tata should have been passed to res');

        res.status(200).send('oktoto')
      })
      .catch(er => {
        // should not pass by here
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

    res.status(201).json({yes: 'oktata'})
  })

  reqq({
    method: 'GET',
    uri: 'http://localhost:3000/app-toto',
    jar: jar
  }, function (er, resp, data) {
    t.error(er, 'response should not be an error', er)
    
    t.ok(200 === resp.statusCode, '/app-toto returns a 200');
    t.ok('oktoto' === data, '/app-toto returns the expected value');

    t.end()
  });
});

