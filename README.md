karlbanke:accounts-cas
===================

CAS login support.

## Usage

put CAS settings in Meteor.settings (for exemple using METEOR_SETTINGS env or --settings) like so:

```
"cas": {
	"baseUrl": "https://mycasserver/cas/",
 	"autoClose": true
},
"public": {
	"cas": {
	    "clientprefix": "myprefix",
		"loginUrl": "https://mycasserver/cas/login",
		"serviceParam": "service",
		"popupWidth": 810,
		"popupHeight": 610
	}
}
```

Then, to start authentication, you have to call the following method from the client (for example in a click handler) :

```
Meteor.loginWithCas([callback]);
```

It must open a popup containing you CAS login from. The popup will be closed immediately if you are
already logged with your CAS server. The clientprefix path may not contain any slashes. This implementation
uses the request library and thus can also be used seamlessly for development. Implementation is based on
atoy40:accounts-cas (https://github.com/atoy40/meteor-accounts-cas)

