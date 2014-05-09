/*
 * Spec for manager.js
 */

// Transforming promises to callbacks (for easy testing)
var nodefn = require('when/node/function');

// Define constants
var testFile = "cubering.FCStd"

// Manager object
var Manager = require('../manager').Manager;

var manager = new Manager();


describe('Manager', function() {

	it("Print generator.py output for the hell of it", function(finished) {

		// Make a dummy request object (Readable Stream)

		// Make a dummy response Writable Stream
		// Or just use this file's stdout to pipe to...

		// Make a filename

		// Make a command block

		// Send command block and response
	});

	xit("Should return the correct tessellation", function(finished) {

	});
});
