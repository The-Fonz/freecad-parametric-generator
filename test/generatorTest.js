/* This file contains the spec for the generator.py script.
 * It uses Jasmine-node, and requires Python 2.7 (the one
 * included with FreeCAD in its root folder).
 */

// Require generator class
var Generator = require('../generator').Generator;

// Using filesystem as Writable Stream
var fs = require('fs');

// Use should for assertions
// https://github.com/visionmedia/should.js
var should = require('should');


var pythonPath   = "C:/Program Files (x86)/FreeCAD0.13/bin/python.exe"; // Full path to FreeCAD python
// Generate path to file by getting directory and then appending the filename
var pyGenPath    = process.cwd() + "\\generator.py";
var testFilePath = process.cwd() + "\\test\\example-parts\\cubering.FCStd";
// Is process.cwd() best way? What if node runs in different folder?


// Let's define a utility method for removing string whitespace
function rmWs(str) {
	// Test if string exists
	if (typeof str !== 'undefined') {
		return str.replace(/[\s]/g, ""); // Return it!
	} else {
		// Return nothing (undefined)
	}
}


// # Testdata
var testdataGraphviz = rmWs( fs.readFileSync( "test/generatorTestExportGraphvizOriginal.txt", 'utf8' ) );
var testdataContent = rmWs( fs.readFileSync( "test/generatorTestGetContentOriginal.txt", 'utf8' ) );
var testdataTessellation = rmWs( fs.readFileSync( "test/generatorTestGetTessellationOriginal.txt", 'utf8' ) );


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


// Instantiate new Generator object. It's initialized with .init
var gen = new Generator( pythonPath, pyGenPath );


// # Describe generator
describe("Generator", function() {

	// ## Successful startup
	describe("Startup, should...", function() {

		it("Start without errors if given a valid filename", function( finished ) {

			// Initialize generator
			gen.init( testFilePath, function (err) {

				should.not.exist( err );

				finished();

			});
		});
	});


	// ## Functionality
	describe("Functions, should...", function() {

		it("Return the right FreeCAD.ActiveDocument.exportGraphviz()", function( finished ) {
			
			var testFilename = "generatorTestExportGraphviz.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.not.exist( err );

				// Now test if result is indeed correct
				result.should.equal(testdataGraphviz);

				finished();

			});

			gen.getGraphviz( dest );

		});


		// Test metadata extraction from the file against known contents
		it("Return the right FreeCAD.ActiveDocument.Content", function( finished ) {
			
			var testFilename = "generatorTestGetContent.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.not.exist( err );

				// Now test if result is indeed correct
				result.should.equal( testdataContent );

				finished();

			});

			gen.getContent( dest );
			
		});


		// Test tessellation output against a known tessellation
		// TODO: Change testdata and generator.py to reflect ALL OBJECTS IN DOCUMENT
		it("Return the correct tessellation", function( finished ) {
			
			var testFilename = "generatorTestGetTessellation.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.not.exist( err );

				// Now test if result is indeed correct
				result.should.equal( testdataTessellation );

				finished();

			});

			gen.getTessellation( dest, 1.0 );
		});


		// Change a known parameter of a known object in the ActiveDocument
		it("Be able to change 'Box' Height", function( finished ) {
			
			// Read metadata, choose first parameter?

			// Make destination
			var testFilename = "generatorTestChangeBoxHeight.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.not.exist( err );

				should.exist( result );

				finished();
			});

			// Change parameter of object
			gen.changeParam( 'Box', 'Height', 20 );

			// Ask for tessellation
			gen.getTessellation( dest, 1 );
		});
	});


	/* ## Export functionality
	xdescribe("Export", function() {
		// Test STL output against a known file
		xit("Should output the correct STL file", function( finished ) {
		});
	});*/
	

	// ## Error throwing on wrong parameters
	describe("Function error throwing, should throw an error...", function() {

		/* Because these tests throw errors and thereby stop generator.py,
		   we need to start them again for each test. */
		beforeEach( function() {
			gen.init( testFilePath );
		});


		it("On non-number tessellation parameter", function( finished ) {

			var testFilename = "generatorTestGetTessellation.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.exist( err );

				should( result ).be.falsy;

				finished();
			});

			gen.getTessellation( dest, 'abc235' );
		});

		it("When trying to change a non-existing object", function( finished ) {

			// Make destination
			var testFilename = "generatorTestChangeBoxHeightErrorNotExistingObject.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.exist( err );

				should(result).be.falsy;

				//should.not.exist( result );

				finished();
			});

			// Change parameter of non-existing object
			gen.changeParam( 'SomeBogusObject1925738967', 'Height', 20 );

			// Ask for tessellation
			gen.getTessellation( dest, 1 );
		});

		it("When trying to change a non-existing parameter", function( finished ) {

			// Make destination
			var testFilename = "generatorTestChangeBoxHeightErrorNotExistingObject.txt";

			var dest = makeDest ( testFilename, function ( err, result ) {

				should.exist( err );

				should(result).be.falsy;

				//should.not.exist( result );

				finished();
			});

			// Change non-existing parameter of existing object
			gen.changeParam( 'Box', 'SomeBogusProperty12379123609732', 30 );

			// Ask for tessellation
			gen.getTessellation( dest, 1 );
		});
	});


	// ## CLosing
	describe("Close", function() {

		// First start again...
		gen.init( testFilePath );

		it("Should close", function(  ) {

			gen.kill().should.be.true;
		});
	});


	// ## Error throwing when initialized with wrong filename
	describe("Init error throwing, should return an error when...", function() {

		// Instantiate new Generator object. It's initialized with .init
		var gen = new Generator( pythonPath, pyGenPath );

		it("Passed no filename", function( finished ) {
			// Spawn process without a filename argument
			gen.init( undefined, function ( err ) {

				should.exist( err );

				finished();
			});
		});

		it("Passed an invalid filename", function( finished ) {

			// Do it again, now with a bogus filename
			gen.init( "somebogusfilename1935814597145908", function ( err ) {

				should.exist( err );

				finished();
			});
		});
	});
});