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
		callBack ( rmWs( fs.readFileSync( testPath, 'utf8' ) ) );
		
	}).on('error', function() {

		throw Error("Problem! Error thrown on file Writable Stream");
	});

	return dest;
}


// Instantiate new Generator object. It's initialized with .init
var gen = new Generator( pythonPath, pyGenPath );


// # Describe generator
describe("Generator", function() {

	// ## Successful startup
	describe("Startup", function() {

		it("Should start without errors if given a valid filename", function( finished ) {

			// Initialize generator
			gen.init( testFilePath, function (err) {

				should.not.exist( err );

				finished();

			});
		});
	});


	// ## Functionality
	describe("Functions", function() {

		it("Should return the right FreeCAD.ActiveDocument.exportGraphviz()", function( finished ) {
			
			var testFilename = "generatorTestExportGraphviz.txt";

			var dest = makeDest ( testFilename, function ( result ) {

				// Now test if result is indeed correct
				result.should.equal(testdataGraphviz);

				finished();

			});

			gen.getGraphviz( dest );

		});


		// Test metadata extraction from the file against known contents
		it("Should return the right FreeCAD.ActiveDocument.Content", function( finished ) {
			
			var testFilename = "generatorTestGetContent.txt";

			var dest = makeDest ( testFilename, function ( result ) {

				// Now test if result is indeed correct
				result.should.equal( testdataContent );

				finished();

			});

			gen.getContent( dest );
			
		});


		// Test tessellation output against a known tessellation
		// TODO: Change testdata and generator.py to reflect ALL OBJECTS IN DOCUMENT
		it("Should return the correct tessellation", function( finished ) {
			
			var testFilename = "generatorTestGetTessellation.txt";

			var dest = makeDest ( testFilename, function ( result ) {

				// Now test if result is indeed correct
				result.should.equal( testdataTessellation );

				finished();

			});

			gen.getTessellation( dest, 1.0 );
		});


		// Change a known parameter of a known object in the ActiveDocument
		xit("Should be able to change 'Box' Height", function( finished ) {
			// Read metadata, choose first parameter?
			// Change parameter
			gen.changeParam( 'Box', 'Height', 20 );

		});
	});


	// ## Export functionality
	xdescribe("Export", function() {
		// Test STL output against a known file
		xit("Should output the correct STL file", function( finished ) {
		});
	});
	

	// ## Error throwing on wrong parameters
	xdescribe("Function error throwing", function() {
		it("Should throw an error on non-number tessellation parameter", function( finished ) {
			/*var p = gen.init( testFilePath );
			var p = gen.getTessellation( 'abc235' );
			nodefn.bindCallback( p, function ( err, res ) {
				expect(err).toBeTruthy();
				// Extra test, not really necessary.
				expect( rmWs(res) ).not.toEqual( rmWs(testdataTessellation) );
				finished();
			});*/
		});
	});


	// ## CLosing
	describe("Close", function() {
		it("Should close", function(  ) {
			gen.kill().should.be.true;
		});
	});


	// ## Error throwing when initialized with wrong filename
	describe("Init error throwing", function() {

		// Instantiate new Generator object. It's initialized with .init
		var gen = new Generator( pythonPath, pyGenPath );

		it("Should give an error when passed no filename", function( finished ) {
			// Spawn process without a filename argument
			gen.init( undefined, function ( err ) {

				should.exist( err );

				finished();
			});
		});

		it("Should give an error when passed an invalid filename", function( finished ) {

			// Do it again, now with a bogus filename
			gen.init( "somebogusfilename1935814597145908", function ( err ) {

				should.exist( err );

				finished();
			});
		});
	});
});