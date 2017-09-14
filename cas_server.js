var Fiber = Npm.require('fibers');
var url = Npm.require('url');
var https = Npm.require('https');
var request = Npm.require('request');

var _casCredentialTokens = {};

RoutePolicy.declare('/'+Meteor.settings.public.cas.clientprefix+'/_cas/', 'network');

/**
 * Initialize CAS with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
var CAS = function CAS(options) {
  options = options || {};

  if (!options.base_url) {
    throw new Error('Required CAS option `base_url` missing.');
  }

  if (!options.service) {
    throw new Error('Required CAS option `service` missing.');
  }

  var cas_url = url.parse(options.base_url);
  if (cas_url.protocol != 'https:') {
    throw new Error('Only https CAS servers are supported.');
  } else if (!cas_url.hostname) {
    throw new Error('Option `base_url` must be a valid url like: https://example.com/cas');
  } else {
    this.hostname = cas_url.host;
    this.port = cas_url.port || 443;
    this.base_path = cas_url.pathname;
  }

  this.service = options.service;
};

/**
 * Library version.
 */

CAS.version = '0.0.1';

/**
 * Attempt to validate a given ticket with the CAS server.
 * `callback` is called with (err, auth_status, username)
 *
 * @param {String} ticket
 * @param {Function} callback
 * @api public
 */

CAS.prototype.validate = function(ticket, callback) {
  var path = url.format({
    pathname: "https://" + this.hostname + ":" + this.port + "/" +  this.base_path +'/validate',
    query: {ticket: ticket, service: this.service}
  })
  console.log('Validation path: ' + path);

  request(path, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
    if (error) {
      callback(e);
    }
    if (body && response && response.statusCode == 200) {
      lines = body.split('\n');
      if (lines.length >= 2 && lines[0].trim()=='yes') {
        console.log('username: ' + lines[1].trim());
        callback(undefined, true, lines[1].trim());
        return;
      }
    }
    callback(undefined, false);
    return;
  });



  // var req = https.get({
  //   host: this.hostname,
  //   port: this.port,
  //
  // }, function(res) {
  //   // Handle server errors
  //   res.on('error', function(e) {
  //     callback(e);
  //   });
  //
  //   // Read result
  //   res.setEncoding('utf8');
  //   var response = '';
  //   res.on('data', function(chunk) {
  //     response += chunk;
  //   });
  //
  //   res.on('end', function() {
  //     var sections = response.split('\n');
  //     if (sections.length >= 1) {
  //       if (sections[0] == 'no') {
  //         callback(undefined, false);
  //         return;
  //       } else if (sections[0] == 'yes' &&  sections.length >= 2) {
  //         callback(undefined, true, sections[1]);
  //         return;
  //       }
  //     }
  //
  //     // Format was not correct, error
  //     callback({message: 'Bad response format.'});
  //   });
  // });
};

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use(function(req, res, next) {
  // Need to create a Fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  Fiber(function () {
    middleware(req, res, next);
  }).run();
});

middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    var barePath = req.url.substring(0, req.url.indexOf('?'));
    var splitPath = barePath.split('/');

    // Any non-cas request will continue down the default
    // middlewares.
    if (splitPath[1] !== Meteor.settings.public.cas.clientprefix && splitPath[2] !== '_cas') {
      console.log("Bare Path: " + barePath);
      console.log("Split Path: " + splitPath[1]);
      console.log("Continue path does not match");
      next();
      return;
    }

    // get auth token
    var credentialToken = splitPath[3];
    if (!credentialToken) {
      closePopup(res);
      return;
    }

    // validate ticket
    casTicket(req, credentialToken, function() {
      closePopup(res);
    });

  } catch (err) {
    console.log("account-cas: unexpected error : " + err.message);
    closePopup(res);
  }
};

var casTicket = function (req, token, callback) {
  // get configuration
  if (!Meteor.settings.cas && !Meteor.settings.cas.validate) {
    console.log("accounts-cas: unable to get configuration");
    callback();
  }

  // get ticket and validate.
  var parsedUrl = url.parse(req.url, true);
  var ticketId = parsedUrl.query.ticket;

  var cas = new CAS({
    base_url: Meteor.settings.cas.baseUrl,
    service: Meteor.absoluteUrl() + "/" + Meteor.settings.public.cas.clientprefix + "/_cas/" + token
  });

  console.log('About to call cas validate');
  cas.validate(ticketId, function(err, status, username) {
    if (err) {
      console.log("accounts-cas: error when trying to validate " + err);
    } else {
      if (status) {
        console.log("accounts-cas: user validated " + username);
        _casCredentialTokens[token] = { id: username };
      } else {
        console.log("accounts-cas: unable to validate " + ticketId);
      }
    }

    callback();
  });

  return; 
};

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
 Accounts.registerLoginHandler(function (options) {

  if (!options.cas)
    return undefined;

  if (!_hasCredential(options.cas.credentialToken)) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
      'no matching login attempt found');
  }

  var result = _retrieveCredential(options.cas.credentialToken);
  var options = { profile: { username: result.id } };
  var user = Accounts.updateOrCreateUserFromExternalService("cas", result);

  return user;
});

var _hasCredential = function(credentialToken) {
  return _.has(_casCredentialTokens, credentialToken);
}

/*
 * Retrieve token and delete it to avoid replaying it.
 */
var _retrieveCredential = function(credentialToken) {
  var result = _casCredentialTokens[credentialToken];
  delete _casCredentialTokens[credentialToken];
  return result;
}

var closePopup = function(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var content = '<html><body><div id="popupCanBeClosed"></div></body></html>';
  res.end(content, 'utf-8');
}
