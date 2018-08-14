karlbanke:accounts-cas
===================

CAS login support.

## Usage

put CAS settings in Meteor.settings (for example using METEOR_SETTINGS env or --settings) like so:

```
"cas": {
	"baseUrl": "https://mycasserver/cas/"
},
"public": {
	"cas": {
		"loginUrl": "https://mycasserver/cas/login",
		"serviceParam": "service"
	}
}
```

Then, to start authentication, you have to call the following method from the client (for example in a click handler) :

```
Meteor.loginWithCas([callback]);
```

It must open a popup containing you CAS login from. The popup will be closed immediately if you are
already logged with your CAS server. This implementation
uses the request library and thus can also be used seamlessly for development. Implementation is based on
atoy40:accounts-cas (https://github.com/atoy40/meteor-accounts-cas).

Upon success of the client side authentication the User is redirected to a page using the
path /cas/<token>. It is up to the client side developer to handle this properly and
subsequently call the function outlined below.

```
 Accounts.callLoginMethod({
                     methodArguments: [{ cas: { credentialToken: token } }],
                        userCallback: (result) => {
                         console.log("result")
                         this.router.navigate(['']);
                     }
                  });
```

For local testing export METEOR_PACKAGE_DIRS to point to this
directory and add an updated version of the project (version number in
package.js) to your project.

