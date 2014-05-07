/*
 * Manager.js is the generator.js 'manager': it starts and stops generators as needed.
 * Usage: instantiate one Manager.js.
 * Notes: Promises are used here.
 */

// # Constants
// Maximum number of generators active at any one time
var MAX_N_GENERATORS = 5;

// # Requires

// [When.js promises](https://github.com/cujojs/when/blob/master/docs/api.md)
var when  = require('when');
// Require generator class
var Generator = require('./generator').Generator;


// # Paths

// Full path to FreeCAD python
var pythonPath   = "C:/Program Files (x86)/FreeCAD0.13/bin/python.exe";
// Generate path to file by getting directory and then appending the filename
var pyGenPath    = process.cwd() + "\\generator.py";

// Path to `.FCStd` models
var cadPath = process.cwd() + "\\spec\\example-parts\\";


// # Constructor
function Manager () {

	// TODO: Take pythonpath, pygenpath, and cadPath as parameters

	// Make new list of generator.js instances.
	// Let's agree that this is a stack, appending the newest last
	this.genList = [];

}

// # Utility functions

// Generates file path from filename
Manager.prototype._constructFilePath = function ( filename ) {
	return cadPath + filename;
}


// Kill excess generators, make room for *n* more
Manager.prototype._killExcessGen = function ( n ) {

	// While there's too many generators running...
	while ( this.genList.length + 1 > MAX_N_GENERATORS ) {

		// New processes are added to end of stack, so first one is oldest
		this.genList[0].kill();

		// Now delete from stack (.shift() works from beginning)
		this.genList.shift();
	}
}

// Return timestamp
Manager.prototype._timestamp = function () {
	// Milliseconds since epoch
	return (new Date).getTime();
}


// # CLass methods

// Creates new instance of generator.js
Manager.prototype._instantiateGen = function ( filename ) {

	var filePath = this._constructFilePath( filename );

	// Instantiate new Generator object. It's initialized with .init
	var gen = new Generator( pythonPath, pyGenPath );

	// Initialize generator, receive promise
	var p = gen.init( filePath );

	// Don't forget to save filename so we can identify it in the list
	gen.filePath = filePath;
	// And give it a timestamp
	// Note: this is not used for now. And there's better ways of setting timeouts.
	gen.startTime = this._timestamp();
	// Add to list
	this.genList.push( gen );

	// Return generator object for immediate use
	return gen;

}

// Finds generator with the given filename and returns its object
Manager.prototype._findGenByFileName = function ( filename ) {

	// We could also use filename, but entire path seems more reliable
	var filePath = this._constructFilePath( filename );

	// Now iterate over this.genList
	for ( var i=0; i<this.genList.length; i++ ) {
		// Check for each one if the path is the same
		if ( this.genList[i].filePath === filePath ) {
			// If so, return the generator object
			return this.genList[i];
		}
	}
	// If not found, return `undefined`
}

// Changes an array of parameters
Manager.prototype._changeParams = function ( genObj, arr ) {
	// `arr` contains all arguments in this form: [ [ obj, param, value ], [ obj, param, value ], ... ]

	// Note: This should be done in generator.js later on.
	// Iterate over all items in array
	for ( var i=0; i<arr.length; i++ ) {
		// changeParam( objName, param, val )
		genObj.changeParam( a[0], a[1], a[2] );
	}
}

// This is the function that should principally be used from the outside
// Changes parameters and returns a tessellation
Manager.prototype.changeAndTess = function ( filename, arr, accuracy ) {

	// First find generator
	// (Pass filename, not path)
	var genObj = this._findGenByFileName( filename );

	// If no generator with this name started yet...
	if ( !genObj ) {

		// If too many generators active already, stop those first,
		// and make room for *n* more
		this._killExcessGen( 1 );

		genObj = this._instantiateGen( filename );
	}

	// Change all parameters
	// Warning: ALL PARAMETERS HAVE TO BE CHANGED!
	// Otherwise there's the danger of inconsistency

	this._changeParams( genObj, arr );

	genObj.getTessellation( accuracy );

}


// # Export the class. Needs to be instantiated with `new`.
exports.Manager = Manager;