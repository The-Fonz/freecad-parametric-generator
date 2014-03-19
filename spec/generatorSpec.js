/* This file contains the spec for the generator.py script.
 * It uses Jasmine-node, and requires Python 2.7 (x64 is preferred as it's faster).
 */

var spawn        = require('child_process').spawn;

//var pythonPath = "C:/Python27x64/python.exe"; // Full path to 64-bit Python
var pythonPath   = "C:/Program Files (x86)/FreeCAD0.13/bin/python.exe" // Full path to FreeCAD python
// Generate path to file by getting directory and then appending the filename
var filePath     = process.cwd() + "\\generator.py";
var testFilePath = process.cwd() + "\\README.md";

var NEWLINE = '\n'; // Python uses this as newline character

describe("Generator", function() {

	var child = null;

	// Test spawning and initializing
	it("Should give an error and exit when passed no or an invalid filename", function( finished ) {
		// Spawn process without a filename argument
		child = spawn( pythonPath, [ filePath ] )
		.stderr.on('data', function (data) {
			// Test for warning
			expect( String(data).match(/Warning/) ).not.toBeNull();
			// Do it again, now with a bogus filename
			child = spawn( pythonPath, [ filePath, "bogus189513471940857" ] )
			.stderr.on('data', function (data) {
				expect( String(data).match(/Warning/) ).not.toBeNull();
				finished();
		  	});
		});
		//stderr.setEncoding('utf8').
	});

	// Test spawning and passing an existing predefined filename
	it("Should start without errors if given a valid filename", function( finished ) {
		child = spawn( pythonPath, [ filePath, testFilePath ] );
		// Make the child be whatever is returned from spawn(), don't chain methods on spawn()
		child.stdout.on('data', function( data ) {
			console.log(String(data));
			if ( String(data).match(/FreeCAD/) ) {
				// Ignore FreeCAD init line
				//console.log("ignoring line");
			}
			else {
				// Test if the status from the message is 0 (which means OK)
				expect( JSON.parse( String(data) ).status  === 0 ).toBeTruthy();
				// Test if any errors were thrown
				expect( child.stderr.read() ).toBeNull(); // Does this work?
				// TODO: Do I have to remove listeners here to make the next child.stdout.on('data',...) work?
				//child.removeAllListeners();
				finished();
			}
		});
	});

	// Test metadata extraction from the file against known metadata
	it("Should return the right metadata", function( finished ) {
		// ATTACH HANLDER BEFORE SENDING COMMAND????!?!!??????
		child.stdout.on('data', function( data ) {
			console.log(String(data))
			// Test some known element of the metadata (like a partial string)
			finished();
		});
		// PROBLEM: Sometimes it does receive data from child.stdout, sometimes not...???
		var msg = {
			type: 'command',
			command: 'returnMetadata',
			options: null // No options needed for this command.
		};
		msgJson = JSON.stringify( msg );
		//console.log( msgJson + NEWLINE );
		console.log( child.stdin.write( msgJson + NEWLINE ) ); // Returns true if flushed
		// Listen for reply
	});
	// Test tessellation output against a known tessellation
	xit("Should return the correct tessellation", function( finished ) {
	});
	// Test STL output against a known file
	xit("Should output the correct STL file", function( finished ) {
	});
	// Change a parameter of a known model, test by reading metadata
	xit("Should be able to change a parameter", function( finished ) {
		// Read metadata, choose first parameter?
		// Change parameter
		// Read metadata, compare
	});
	// Test if it can be completely reset (made 'blank'), to re-use this process
	xit("Should be able to completely reset", function() {
		// Reset process
		// Test if it's indeed blank now (not having any open documents)
		// Test if memory use is not more than at the beginning
		//   (if memory hoarding occurs, thread re-using is not a good idea)
	});

	it("Should close", function(  ) {
		//console.log(child);
		expect( child.kill() ).not.toBeNull();
	});
});