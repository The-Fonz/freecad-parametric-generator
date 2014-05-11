/*
 * This module contains all necessary utility methods that can't
 * be categorized as part of another module but are used all over
 * the place.
 */

// Using filesystem as Writable Stream
var fs = require('fs');


function returnConsole (DEBUG) {
	if (DEBUG) {
		return console;
	} else {
		return {
			log: function(){},
			error: function(){}
		}
	}
}

// Let's define a utility method for removing string whitespace
function rmWs (str) {
	// Test if string exists
	if (typeof str !== 'undefined') {
		return str.replace(/[\s]/g, ""); // Return it!
	} else {
		// Return nothing (undefined)
	}
}

// Define utility function to easily test output to writable stream
// It simply returns the result to the callback function
function makeDest ( testFilename, callBack ) {

	var testPath = "./test/" + testFilename;

	// Writable Stream
	var dest = fs.createWriteStream( testPath, 'utf8' );

	dest.on('pipe', function() {

		//console.log("Piping in");

	}).on('finish', function() {

		// Call callback with result
		if (callBack)
			callBack ( null, rmWs( fs.readFileSync( testPath, 'utf8' ) ) );
		
	}).on('error', function(err) {

		// This should never happen
		throw Error("Problem! Error thrown on file Writable Stream, error:\n" + err );

	// This custom event gets emitted when there's an error in generator.py
	}).on('generr', function(generr) {

		// Call callback with error
		callBack( generr, null );

		// Don't let callback be called again on 'finish'
		callBack = null;

	});

	return dest;
}



// Set exports
// ===========

module.exports.rmWs = rmWs;

module.exports.returnConsole = returnConsole;

module.exports.makeDest = makeDest;