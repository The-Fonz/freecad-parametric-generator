/*
 * Manager.js is the generator.js 'manager': it starts and stops generators as needed.
 * Usage: instantiate one Manager.js.
 * 
 */

// Constants
// =========

// Maximum number of generators active at any one time
var MAX_N_GENERATORS = 2;

// Requires
// ========

// Require generator class
var Generator = require('./generator').Generator;

// Path module
var path = require('path');

// Include custom utilities
var utils = require('./utils');



// Paths
// =====

// Full path to FreeCAD python
var FCPYTHONPATH   = path.normalize( "C:/Program Files (x86)/FreeCAD0.13/bin/python.exe" );

//var PYGENPATH    = process.cwd() + "\\generator.py";
// `path.resolve(to)` returns the absolute path to `to`.
var PYGENPATH    = path.resolve( "./generator.py" );

// Path to `.FCStd` models
//var CADPATH = process.cwd() + "\\spec\\example-parts\\";
var CADPATH = path.resolve( "./test/example-parts/" );



// Debug mode
// ----------

// Turn printing to console on or off
var DEBUG = true;

// If DEBUG, output to console, otherwise construct dummy object
var debug = utils.returnConsole( DEBUG );


// Constructor
// ===========
function Manager () {

	// TODO: Take pythonpath, pygenpath, and cadPath as parameters

	// Make new list of generator.js instances.
	// Let's agree that this is a stack, appending the newest last
	this.genList = [];

}


// Utility functions
// =================

// ## Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// ## Return timestamp
Manager.prototype._timestamp = function () {
	// Milliseconds since epoch
	return (new Date).getTime();
}

// ## Generate file path from filename
Manager.prototype._constructFilePath = function ( filename ) {
	// Using the robust path module methods for this
	return path.join( CADPATH, filename );
}


// ## Kill excess generators, make room for *n* more
Manager.prototype._killExcessGen = function ( n ) {

	// While there's too many generators running...
	while ( this.genList.length + n > MAX_N_GENERATORS ) {

		// New processes are added to end of stack, so first one is oldest
		// Now delete from stack (.shift() works from beginning)
		var kg = this.genList.shift();
		// Kill generator process
		kg.kill();

		debug.log("Excess generator killed");
	}
}

// ## Kill generator by timestamp
Manager.prototype._destroyGenByTimestamp = function ( timestamp ) {

	// While there's too many generators running...
	for ( var i=0; i<this.genList.length; i++ ) {

		if ( this.genList[i].timestamp === timestamp ) {

			// Probably not necessary
			this.genList[i].kill();

			// Now remove from array
			this.genList.remove(i);
		}

		debug.log("Generator with timestamp " + timestamp + "ms killed");
	}
}


// CLass methods
// =============

// Create new instance of generator.js
Manager.prototype._instantiateGen = function ( filename ) {

	var filePath = this._constructFilePath( filename );

	// Instantiate new Generator object. It's initialized with .init
	var gen = new Generator( FCPYTHONPATH, PYGENPATH );

	// Initialize generator
	gen.init( filePath );

	// Add queue for command blocks to object (only accessed by this file)
	// Let's agree that new command blocks get pushed onto the queue, so that
	// the first command is the oldest (and has highest priority).
	// The last command in a row is always a tessellation.
	gen.cmdBlockQueue = [];

	// Don't forget to save filename so we can identify it in the list
	gen.filePath = filePath;

	// And give it a timestamp
	// Note: this is not used for now. And there's better ways of setting timeouts.
	gen.timestamp = this._timestamp();

	// Add to list
	this.genList.push( gen );

	debug.log("New generator instantiated");

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
	// If not found, returns `undefined`
}

// ## Retrieves next command from queue and sends it
Manager.prototype._sendNextCmdBlock = function ( genObj ) {

	debug.log("Manager._sendNextCmdBlock called");

	// First get oldest queueObj in queue
	var qo = genObj.cmdBlockQueue.shift();

	// If there is anything in queue...
	if (qo) {
		debug.log("Sending new command block from queue");
		// Send it
		this._sendCmdBlock( genObj, qo.res, qo.cmdBlock );
	} else {
		debug.log("No commands in queue");
	}
}

// ## Sends command block to generator.js
Manager.prototype._sendCmdBlock = function ( genObj, res, cmdBlock ) {

	// First change parameters
	for (var i=0; i<cmdBlock.length; i++) {

		var b = cmdBlock[i];

		if ( b.command === 'changeParam' ) {

			genObj.changeParam( b.obj, b.param, b.value );

		} else {
			// Is this a good idea?
			throw Error("Can't handle that type yet");
		}
	}

	// Then request tessellation (pipes it through to res)
	genObj.getTessellation( res, .1 );		

}



// ## This is the function that should principally be used from the outside.
// It receives a command block and does all the necessary steps to manage it.
Manager.prototype.cmdsAndTessellate = function ( req, res, filename, cmdBlock ) {


	// ### Find generator

	// (Pass filename, not path)
	var genObj = this._findGenByFileName( filename );

	// If no generator with this name started yet...
	if ( !genObj ) {

		// If too many generators active already, stop those first,
		// and make room for *n* more
		this._killExcessGen( 1 );

		// Now instantiate new generator
		genObj = this._instantiateGen( filename );
	}


	var timestamp = this._timestamp();

	// ### Put res and cmdBlock into one object to be able to put it into queue
	var queueObj = {
		res: res,
		// Use timestamp for easy identification later on
		timestamp: timestamp,
		cmdBlock: cmdBlock
	};

	// Put commands in waiting queue
	genObj.cmdBlockQueue.push( queueObj );

	// Listen for 'close' on request (its only event). Delete corresponding command block
	req.on( 'close', function (  ) {

		debug.log("Request emitted 'close'");

		/* Delete command block. As the position of queueObj's constantly change,
		   we need an identifier to identify the block. That's what we use the
		   timestamp for. (Potentially other commands with same timestamp can be
		   deleted accidentally, but the chance of equal timestamps is very small) */
		for (var i=0; i<genObj.cmdBlockQueue.length; i++) {

			// Search for timestamp
			if ( genObj.cmdBlockQueue.timestamp === timestamp ) {

				// Delete command block from queue
				genObj.cmdBlockQueue.remove( i );

				debug.log("Deleted command block with timestamp " + timestamp);
			}
		}
	});

	/* Also include a timeout here. If there *are* many requests and they don't
	   close, we must avoid flooding the generator. (Or is there already a built-in
	   timeout on requests?) */



	// ### Connect to all possible events on the response object to handle sending next command later on

	// Listen for 'close' and 'finish' (and 'unpipe'? and 'error'?) on response object. Then send next block
	res.on('finish', function () {

		// All is fine, res.end() was called. Send next command
		this._sendNextCmdBlock( genObj );

	// Bind anonymous function to be able to access Manager.this
	}.bind(this) ).on('close', function () {

		// The underlying connection was terminated before calling res.end()
		// http://nodejs.org/api/http.html#http_event_close_1
		debug.error("Response emitted 'close': the underlying \
			connection was terminated before calling res.end()");

		this._sendNextCmdBlock( genObj );

	// Bind anonymous function to be able to access Manager.this
	}.bind(this) ).on('error', function(err) {

		// This should never happen
		throw Error("Problem! Error thrown on file Writable Stream, error:\n" + err );

	// This custom event gets emitted when there's an error in generator.py
	}.bind(this) ).on('generr', function(generr) {

		debug.error("Generator.py error occurred"+generr);

		// Notify the response of the error
		if ( !res.headersSent ) {

			res.writeHead( 500, "Generator.py threw an error" );

		} else {
			throw Error("Headers already sent while there's an error:\n" + generr );
		}

		// First remove this crashed generator
		this._destroyGenByTimestamp( timestamp );

		// Now restart the generator
		genObj = this._instantiateGen( filename );

		// And send the next command
		this._sendNextCmdBlock( genObj );

	}.bind(this) );

	//console.log("LENGTH: "+genObj.cmdBlockQueue.length);

	// ### If there are no commands in queue, send current command
	if ( genObj.cmdBlockQueue.length <= 1 ) {
		this._sendNextCmdBlock( genObj );
	}

}


// # Export the class. Needs to be instantiated with `new`.
exports.Manager = Manager;