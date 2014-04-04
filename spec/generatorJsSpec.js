/* This file contains the spec for the generator.py script.
 * It uses Jasmine-node, and requires Python 2.7 (x64 is preferred as it's faster).
 */

// Require generator class
var Generator = require('../generator').Generator;
var nodefn = require('when/node/function');

var pythonPath   = "C:/Program Files (x86)/FreeCAD0.13/bin/python.exe" // Full path to FreeCAD python
// Generate path to file by getting directory and then appending the filename
var pyGenPath    = process.cwd() + "\\generator.py";
var testFilePath = process.cwd() + "\\spec\\example-parts\\cubering.FCStd";
// Is process.cwd() best way? What if node runs in different folder?

// Regex to remove whitespace (which can differ between similar objects)
var REGWS = /[\s]/g; // Don't forget global flag, otherwise only first match
// Let's add a method to the String prototype for convenience
String.prototype.rmWs = function() {
	// Check if it's undefined, otherwise this.replace() hangs!
	if ( typeof this != 'undefined' )
		// PROBABLY DOESN'T WORK PROPERLY!
		return this.replace(REGWS, ""); // Return it!
	else
		return false;
}

// # Testdata
var testdataGraphviz = 'digraph G {\n0[label="Box"];\n1[label="Box001"];\n2[label="Cut"];\n2->0 ;\n2->1 ;\n}\n'
var testdataContent = '<?xml version=\'1.0\' encoding=\'utf-8\'?>\n<!--\n FreeCAD Document, see http://free-cad.sourceforge.net for more information...\n-->\n<Document SchemaVersion="4">\n\t<Properties Count="9">\n\t\t<Property name="Comment" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="Company" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="CreatedBy" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="CreationDate" type="App::PropertyString">\n\t\t\t<String value="Sun Mar 23 19:54:49 2014 "/>\n\t\t</Property>\n\t\t<Property name="FileName" type="App::PropertyString">\n\t\t\t<String value="C:/Users/Fons/GitHub/freecad-parametric-generator/spec/example-parts/cubering.FCStd"/>\n\t\t</Property>\n\t\t<Property name="Id" type="App::PropertyString">\n\t\t\t<String value="7223bb7d-caef-4514-bbbd-3b125e46527d"/>\n\t\t</Property>\n\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t<String value="cubering"/>\n\t\t</Property>\n\t\t<Property name="LastModifiedBy" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="LastModifiedDate" type="App::PropertyString">\n\t\t\t<String value="Sun Mar 23 23:29:43 2014 "/>\n\t\t</Property>\n\t</Properties>\n\t<Objects Count="3">\n\t\t<Object type="Part::Box" name="Box" />\n\t\t<Object type="Part::Box" name="Box001" />\n\t\t<Object type="Part::Cut" name="Cut" />\n\t</Objects>\n\t<ObjectData Count="3">\n\t\t<Object name="Box">\n\t\t\t<Properties Count="7">\n\t\t\t\t<Property name="Height" type="App::PropertyLength">\n\t\t\t\t\t<Float value="20"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Box"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Length" type="App::PropertyLength">\n\t\t\t\t\t<Float value="10"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="0" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Width" type="App::PropertyLength">\n\t\t\t\t\t<Float value="10"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t\t<Object name="Box001">\n\t\t\t<Properties Count="7">\n\t\t\t\t<Property name="Height" type="App::PropertyLength">\n\t\t\t\t\t<Float value="12"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Box001"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Length" type="App::PropertyLength">\n\t\t\t\t\t<Float value="5"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="2" Py="3" Pz="-1" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Width" type="App::PropertyLength">\n\t\t\t\t\t<Float value="5"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t\t<Object name="Cut">\n\t\t\t<Properties Count="6">\n\t\t\t\t<Property name="Base" type="App::PropertyLink">\n\t\t\t\t\t<Link value="Box"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Cut"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="0" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Tool" type="App::PropertyLink">\n\t\t\t\t\t<Link value="Box001"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t</ObjectData>\n</Document>\n'
// TODO: Change this to a non-string (it's not usable data like this)
var testdataTessellation = '([Vector (0, 10, 20), Vector (0, 10, 0), Vector (0, 0, 20), Vector (0, 0, 0), Vector (10, 0, 0), Vector (10, 0, 20), Vector (10, 10, 20), Vector (10, 10, 0), Vector (2, 3, 0), Vector (2, 8, 0), Vector (7, 3, 0), Vector (7, 8, 0), Vector (7, 3, 11), Vector (2, 3, 11), Vector (7, 8, 11), Vector (2, 8, 11)], [(0, 1, 2), (1, 3, 2), (3, 4, 5), (2, 3, 5), (6, 0, 2), (6, 2, 5), (6, 7, 1), (6, 1, 0), (8, 3, 1), (8, 1, 9), (4, 3, 10), (3, 8, 10), (9, 1, 11), (10, 11, 7), (4, 10, 7), (11, 1, 7), (5, 7, 6), (5, 4, 7), (12, 8, 13), (12, 10, 8), (14, 11, 12), (11, 10, 12), (15, 9, 14), (9, 11, 14), (13, 9, 15), (13, 8, 9), (13, 15, 14), (12, 13, 14)])'
var testdataTessellationHeight20 = '([Vector (0, 10, 20), Vector (0, 10, 0), Vector (0, 0, 20), Vector (0, 0, 0), Vector (10, 0, 0), Vector (10, 0, 20), Vector (10, 10, 20), Vector (10, 10, 0), Vector (2, 3, 0), Vector (2, 8, 0), Vector (7, 3, 0), Vector (7, 8, 0), Vector (7, 3, 11), Vector (2, 3, 11), Vector (7, 8, 11), Vector (2, 8, 11)], [(0, 1, 2), (1, 3, 2), (3, 4, 5), (2, 3, 5), (6, 0, 2), (6, 2, 5), (6, 7, 1), (6, 1, 0), (8, 3, 1), (8, 1, 9), (4, 3, 10), (3, 8, 10), (9, 1, 11), (10, 11, 7), (4, 10, 7), (11, 1, 7), (5, 7, 6), (5, 4, 7), (12, 8, 13), (12, 10, 8), (14, 11, 12), (11, 10, 12), (15, 9, 14), (9, 11, 14), (13, 9, 15), (13, 8, 9), (13, 15, 14), (12, 13, 14)])'

describe("Generator", function() {

	// Instantiate new Generator object. It's initialized with .init
	var gen = new Generator( pythonPath, pyGenPath );

	it("Should give an error when passed no filename", function( finished ) {
		// Spawn process without a filename argument
		var p = gen.init(  );
		nodefn.bindCallback( p, function ( err, res ) {
			//console.log(err);
			expect(err).toBeTruthy();
			finished();
		});
	});
	it("Should give an error when passed an invalid filename", function( finished ) {
		// Do it again, now with a bogus filename
		var p = gen.init( "somebogusfilename1935814597145908" );
		nodefn.bindCallback( p, function ( err, res ) {
			//console.log(err);
			expect(err).toBeTruthy();
			finished();
		});
	});
	it("Should start without errors if given a valid filename", function( finished ) {
		// Instantiate new Generator object, PARENT SCOPE
		gen = new Generator( pythonPath, pyGenPath );
		// Initialize generator, receive promise
		var p = gen.init( testFilePath );
		nodefn.bindCallback( p, function ( err, res ) {
			//console.log(err);
			//console.log(res);
			expect(err).toBeNull();
			finished();
		});
	});

	it("Should return the right FreeCAD.ActiveDocument.exportGraphviz()", function( finished ) {
		var p = gen.exportGraphviz();
		nodefn.bindCallback( p, function ( err, res ) {
			expect( err ).toBeNull();
			//console.log(res.rmWs());
			//console.log(testdataGraphviz.rmWs());
			expect( res.rmWs() ).toEqual( testdataGraphviz.rmWs() );
			finished();
		});
	});

	// Test metadata extraction from the file against known contents
	it("Should return the right FreeCAD.ActiveDocument.Content", function( finished ) {
		// Send command, receive promise
		var p = gen.getContent();
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			// Test some known element of the metadata (like a partial string)
			expect( res.rmWs() ).toEqual( testdataContent.rmWs() );
			//console.log(res);
			finished();
		});
	});
	// Test tessellation output against a known tessellation
	// TODO: Change testdata and generator.py to reflect ALL OBJECTS IN DOCUMENT
	it("Should return the correct tessellation", function( finished ) {
		var p = gen.getTessellation( 1.0 );
		/*p.done( function( res ) {
			expect( res.rmWs() ).toEqual( testdataTessellation.rmWs() );
			finished();
		}, function( err ) {
			expect(false).toBeTruthy();
			finished();
		});*/
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			expect( res.rmWs() ).toEqual( testdataTessellation.rmWs() );
			finished();
		});
	});
	// Change a known parameter of a known object in the ActiveDocument
	it("Should be able to change 'Box' Height", function( finished ) {
		// Read metadata, choose first parameter?
		// Change parameter
		var p = gen.changeParam( 'Box', 'Height', 20 );
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			expect(res).toBeNull(); // .changeParam only resolves, without result
			finished();
		});
	});
	// Test tessellation output of changed object
	it("Should be able to return correct tessellation once more", function( finished ) {
		//var p = gen.init( testFilePath );
		var p = gen.getTessellation( 1.0 );
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			expect( res ).toEqual( testdataTessellationHeight20 );
			finished();
		});
	});
	// Test error throwing on wrong tessellation parameter
	it("Should throw an error on non-number tessellation parameter", function( finished ) {
		//var p = gen.init( testFilePath );
		var p = gen.getTessellation( 'abc235' );
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeTruthy();
			expect( res ).not.toEqual( testdataTessellationHeight20 );
			finished();
		});
	});
	// Test STL output against a known file
	xit("Should output the correct STL file", function( finished ) {
	});
	// Test if it can be completely reset (made 'blank'), to re-use this process
	xit("Should be able to completely reset", function() {
		// Reset process
		// Test if it's indeed blank now (not having any open documents)
		// Test if memory use is not more than at the beginning
		//   (if memory hoarding occurs, thread re-using is not a good idea)
	});

	it("Should close", function(  ) {
		expect( gen.kill() ).not.toBeNull();
	});
});