Package.describe({
  summary: "CAS support for accounts",
  version: "0.1.0",
  name: "karlbanke:accounts-cas",
  git:  "https://github.com/karlbanke/meteor-accounts-cas"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@2.4.0');
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('underscore');


  api.addFiles('cas_client.js', 'web.browser');
  api.addFiles('cas_server.js', 'server');

});

Npm.depends({
  request: "2.81.0"
});

