
Meteor.loginWithCas = function(callback) {

    var credentialToken = Random.id();

    if (!Meteor.settings.public &&
        !Meteor.settings.public.cas &&
        !Meteor.settings.public.cas.loginUrl) {
        return;
    }

    var settings = Meteor.settings.public.cas;

    var loginUrl = settings.loginUrl +
        "?" + (settings.service || "service") + "=" +
        Meteor.absoluteUrl('_cas/') +
        credentialToken;

    window.location = loginUrl;

};


