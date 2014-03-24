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
	this.replace(REGWS, "");
}

// # Testdata
var testdataGraphviz = 'digraph G {\n0[label="Box"];\n1[label="Box001"];\n2[label="Cut"];\n2->0 ;\n2->1 ;\n}\n'
var testdataContent = '<?xml version=\'1.0\' encoding=\'utf-8\'?>\n<!--\n FreeCAD Document, see http://free-cad.sourceforge.net for more information...\n-->\n<Document SchemaVersion="4">\n\t<Properties Count="9">\n\t\t<Property name="Comment" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="Company" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="CreatedBy" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="CreationDate" type="App::PropertyString">\n\t\t\t<String value="Sun Mar 23 19:54:49 2014 "/>\n\t\t</Property>\n\t\t<Property name="FileName" type="App::PropertyString">\n\t\t\t<String value="C:/Users/Fons/GitHub/freecad-parametric-generator/spec/example-parts/cubering.FCStd"/>\n\t\t</Property>\n\t\t<Property name="Id" type="App::PropertyString">\n\t\t\t<String value="7223bb7d-caef-4514-bbbd-3b125e46527d"/>\n\t\t</Property>\n\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t<String value="cubering"/>\n\t\t</Property>\n\t\t<Property name="LastModifiedBy" type="App::PropertyString">\n\t\t\t<String value=""/>\n\t\t</Property>\n\t\t<Property name="LastModifiedDate" type="App::PropertyString">\n\t\t\t<String value="Sun Mar 23 19:58:35 2014 "/>\n\t\t</Property>\n\t</Properties>\n\t<Objects Count="3">\n\t\t<Object type="Part::Box" name="Box" />\n\t\t<Object type="Part::Box" name="Box001" />\n\t\t<Object type="Part::Cut" name="Cut" />\n\t</Objects>\n\t<ObjectData Count="3">\n\t\t<Object name="Box">\n\t\t\t<Properties Count="7">\n\t\t\t\t<Property name="Height" type="App::PropertyLength">\n\t\t\t\t\t<Float value="10"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Box"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Length" type="App::PropertyLength">\n\t\t\t\t\t<Float value="10"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="0" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Width" type="App::PropertyLength">\n\t\t\t\t\t<Float value="10"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t\t<Object name="Box001">\n\t\t\t<Properties Count="7">\n\t\t\t\t<Property name="Height" type="App::PropertyLength">\n\t\t\t\t\t<Float value="12"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Box001"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Length" type="App::PropertyLength">\n\t\t\t\t\t<Float value="5"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="2" Py="3" Pz="-1" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Width" type="App::PropertyLength">\n\t\t\t\t\t<Float value="5"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t\t<Object name="Cut">\n\t\t\t<Properties Count="6">\n\t\t\t\t<Property name="Base" type="App::PropertyLink">\n\t\t\t\t\t<Link value="Box"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Label" type="App::PropertyString">\n\t\t\t\t\t<String value="Cut"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Placement" type="App::PropertyPlacement">\n\t\t\t\t\t<PropertyPlacement Px="0" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Pos" type="App::PropertyPlacementLink">\n\t\t\t\t\t<Link value=""/>\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Shape" type="Part::PropertyPartShape">\n\t\t\t\t</Property>\n\t\t\t\t<Property name="Tool" type="App::PropertyLink">\n\t\t\t\t\t<Link value="Box001"/>\n\t\t\t\t</Property>\n\t\t\t</Properties>\n\t\t</Object>\n\t</ObjectData>\n</Document>\n'
// TODO: Change this to a non-string (it's not usable data like this)
var testdataTessellation = '([Vector (0, 10, 10), Vector (0, 10, 0), Vector (0, 0, 10), Vector (0, 0, 0), Vector (10, 0, 0), Vector (10, 0, 10), Vector (2, 3, 10), Vector (2, 8, 10), Vector (7, 3, 10), Vector (7, 8, 10), Vector (10, 10, 10), Vector (10, 10, 0), Vector (2, 3, 0), Vector (2, 8, 0), Vector (7, 3, 0), Vector (7, 8, 0)], [(0, 1, 2), (1, 3, 2), (3, 4, 5), (2, 3, 5), (0, 2, 6), (7, 0, 6), (8, 2, 5), (8, 6, 2), (9, 0, 7), (10, 9, 8), (10, 8, 5), (10, 0, 9), (10, 11, 1), (10, 1, 0), (12, 3, 1), (12, 1, 13), (4, 3, 14), (3, 12, 14), (13, 1, 15), (14, 15, 11), (4, 14, 11), (15, 1, 11), (5, 11, 10), (5, 4, 11), (8, 12, 6), (8, 14, 12), (9, 15, 8), (15, 14, 8), (7, 13, 9), (13, 15, 9), (6, 13, 7), (6, 12, 13)])'
var testdataTessellationHeight20 = '([Vector (0, 10, 20), Vector (0, 10, 0), Vector (0, 0, 20), Vector (0, 0, 0), Vector (10, 0, 20), Vector (10, 10, 0), Vector (10, 10, 20), Vector (10, 0, 0)], [(0, 1, 2), (1, 3, 2), (4, 5, 6), (4, 7, 5), (3, 7, 4), (2, 3, 4), (6, 5, 1), (6, 1, 0), (3, 1, 5), (7, 3, 5), (6, 0, 2), (6, 2, 4)])'

describe("Generator", function() {

	// Instantiate new Generator object. It's initialized with .init
	var gen = new Generator( pythonPath, pyGenPath );

	xit("Should give an error when passed no filename", function( finished ) {
		// Spawn process without a filename argument
		var p = gen.init(  );
		nodefn.bindCallback( p, function ( err, res ) {
			//console.log(err);
			expect(err).toBeTruthy();
			finished();
		});
	});
	xit("Should give an error when passed an invalid filename", function( finished ) {
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

	xit("Should return the right FreeCAD.ActiveDocument.exportGraphviz()", function( finished ) {
		var p = gen.exportGraphviz();
		nodefn.bindCallback( p, function ( err, res ) {
			expect( err ).toBeNull();
			expect( res.rmWs() ).toEqual( testdataGraphviz.rmWs() );
			finished();
		});
	});

	// Test metadata extraction from the file against known contents
	xit("Should return the right FreeCAD.ActiveDocument.Content", function( finished ) {
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
	xit("Should return the correct tessellation", function( finished ) {
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
	xit("Should be able to change 'Box' Height", function( finished ) {
		// Read metadata, choose first parameter?
		// Change parameter
		var p = gen.changeParam( 'Box', 'Height', 20 );
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			expect(res).toBeUndefined(); // .changeParam only resolves, without result
			finished();
		});
	});
	// Test tessellation output of changed object
	// TODO: Change testdata and generator.py to reflect ALL OBJECTS IN DOCUMENT
	it("Should be able to return correct tessellation once more", function( finished ) {
		//var p = gen.init( testFilePath );
		// TESTING: Why won't the error given on not being able to cast 'a' return the promise?
		var p = gen.getTessellation( 'a' );
		nodefn.bindCallback( p, function ( err, res ) {
			expect(err).toBeNull();
			expect( res.rmWs() ).toEqual( testdataTessellationHeight20.rmWs() );
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