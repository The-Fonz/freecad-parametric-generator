/*
 * Spec for manager.js
 */

// Transforming promises to callbacks (for easy testing)
var nodefn = require('when/node/function');

// Define constants
var testFile = "torus.FCStd"

// Manager object
var Manager = require('../manager').Manager;

var manager = new Manager();


describe('Manager', function() {

	it("Should return the correct tessellation", function(finished) {

		var paramArr = []//[[],[],[]];

		var accuracy = .1; // mm?

		var p = manager.changeAndTess( testFile, paramArr, accuracy );

		nodefn.bindCallback( p, function ( err, res ) {
			console.log(err);
			//console.log(res);
			expect(err).toBeNull();
			//expect( res ).toEqual( testtess );
			finished();
		});

	});
});
