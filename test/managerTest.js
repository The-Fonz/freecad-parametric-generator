/*
 * Spec for manager.js
 */

// Define constants
var testFile = "cubering.FCStd";

// Manager object
var Manager = require('../manager').Manager;

var manager = new Manager();

// Server and request stuff, to not have to make dummy requests/responses
var http = require('http');

// URL parsing logic
var url = require('url');

// Assertions
var should = require('should');

// Using filesystem as Writable Stream
var fs = require('fs');


// Make server
var server = http.createServer( function( request, response ) {

	var hash = url.parse( request.url ).hash;

	if (hash) {

		// Remove leading hash sign from hash
		hash = hash.replace('#', '');

		// Split at '&' sign
		var hashArr = hash.split('&');


		for (var i=0; i<hashArr.length; i++) {

			// Split at '=' (object:parameter=value)
			var objParam = hashArr[i].split('=')[0];
			var value    = hashArr[i].split('=')[1];

			// Split at ':' (object:parameter)
			var obj = objParam.split(':')[0];
			var param = objParam.split(':')[1];

			hashArr[i] = {
				command: 'changeParam',
				obj: obj,
				param: param,
				value: value
			}
		}

		var cmdBlock = hashArr;

		var filename = "torus.FCStd";

		//console.log( cmdBlock );

		// TESTING
		//response.writeHead( 200 );
		//response.end("HITHERE");

		// Now call `manager.js`
		manager.cmdsAndTessellate( request, response, filename, cmdBlock );

	} else {
		// No hash!
		response.writeHead( 500 );
		response.end('No hash!');
	}


// Listen on port 4000
}).listen(4000);


describe('Manager', function() {

	it("Test-server connection should work", function(finished) {

		// Make options
		var options = {
		  hostname: 'localhost',
		  port: 4000,
		  path: ''
		};

		// Send request
		http.get( options, function( res ) {

			should( res.statusCode ).equal( 500 );

			finished();
		});
	});

	it("Should return correct tessellation", function(finished) {

		// Make a hash
		var hash = '#Array:NumberPolar=14';

		// Make options
		var options = {
		  hostname: 'localhost',
		  port: 4000,
		  path: '/' + hash
		};

		// Send request
		http.get( options, function( res ) {
			
			should( res.statusCode ).equal( 200 );

			var testfn = "./test/managerTestTessellationOutput.txt";

			res.pipe( fs.createWriteStream( testfn, 'utf8' ) );

			finished();
		});
	});

	it("Should close", function() {
		server.close( function(err) {
			should.not.exist(err);
		});
	});


});
