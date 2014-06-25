/*
 * This is a thin and 'dumb' wrapper to communicate with `generator.py` processes.
 * It doesn't do much more than send commands to `generator.py` and pipe the output
 * back to the recipient. Its smartest feature is how it detects end of transmission:
 * it listens for '!ENDSTREAM!' strings on stderr (a new way like this is needed
 * as stdio[3] is piped through without listening).
 */


// Requires
// --------
var spawn = require('child_process').spawn;

var NEWLINE = require('os').EOL;

var utils = require('./utils');


// Debug mode
// ----------

// Turn printing to debug on or off
var DEBUG = true;

// If DEBUG, output to debug, otherwise construct dummy object
var debug = utils.returnConsole( DEBUG );


// Class constructor
// -----------------
Generator = function ( pythonPath, pyGenPath ) {
	self = this;
	// Define all class variables
	self.pythonPath = pythonPath;
	self.pyGenPath  = pyGenPath;
	self.gen = null;
}


// Utility functions
// -----------------

// ## Internal utility method to construct and send msgs on stdin
Generator.prototype._sendCmd = function( command, options ) {

	var msg = JSON.stringify({
		type: 'command',
		command: command, // Accept any 'options' value
		options: typeof options !== 'undefined' ? options : null // No options needed for this command.
	});

	debug.log("COMMAND SENT: " + msg);
	
	return self.gen.stdin.write( msg + NEWLINE );
};


// ## Pipe generator.py output to recipient
Generator.prototype._pipe = function ( destinationStream ) {
	// Remember recipient
	this.recipient = destinationStream;

	/* Prevent end() being called when stdio[3] closes, so we can still emit 'generr' on
	   stdio[3] to signal an error */
	var pipeOpts = { end: false };

	// Pipe stdio[3] of generator.py to the destination Writable Stream
	self.gen.stdio[3].pipe( this.recipient, pipeOpts );
}


// Initialization function
// -----------------------

// ## Loads cad file, spawns generator, attaches handlers to stderr and stdio[3]
// The callback is notified on successful startup.
Generator.prototype.init = function ( filePath, startupCallBack ) {

	// Open fd3 as well
	var spawnOpts = { stdio: [ 'pipe', 'pipe', 'pipe', 'pipe' ] }

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ], spawnOpts );

	// ### Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdio[3].setEncoding( enc );
	self.gen.stdin.setEncoding( enc );

	// ### Remember the current recipient of generator.py stdio[3]
	self.recipient = null;

	// ### Attach one global stderr listener. Stderr functions as message passing so
	// stdio[3] can be used just for piping.
	self.gen.stderr.on('data', function (err) {

		/* If it contains "!ENDSTREAM!" it actually means that the data has ended,
		   and we can close the receiving stream (upon checking if there's no data
		   left to be flushed!) */
		if ( err.match(/!ENDSTREAM!/g) ) {

			if (self.recipient) {

				/* Check if stdio[3] has been flushed,
				to avoid premature ending of destination stream!
				I hacked into Node's `Stream` module, here's the relevant parts:
				https://github.com/joyent/node/blob/master/lib/_stream_readable.js#L504 */

				// If there's still data left to drain...
				if ( this.gen.stdio[3]._readableState.awaitDrain ) {

					debug.log("###  _readableState: " + this.gen.stdio[3]._readableState.awaitDrain );

					// listen for drain on recipient
					this.recipient.on('drain', onDrain.bind(this) );

				// If there's no data left to drain
				} else {
					// End stream
					debug.log("No drainage needed, ending recipient at once");
					self.recipient.end();

					// Clear recipient
					self.recipient = null;
				}

				function onDrain() {
					debug.log("###  _readableState: " + this.gen.stdio[3]._readableState.awaitDrain );
					// Check if it's been fully drained now
					if ( 0 === this.gen.stdio[3]._readableState.awaitDrain ) {

						debug.log("FULLY DRAINED");

						// End stream
						self.recipient.end();

						// Remove this listener
						self.recipient.removeListener('drain', onDrain );

						// Clear recipient
						self.recipient = null;
					}
				}

			} else {
				// Weird! Recipient doesn't exist.
				//throw Error("Recipient doesn't exist!");
				debug.error( "Recipient doesn't exist!" );
			}

		// Generator.py sends '!BEGIN!' on stderr when successfully initialized
		} else if ( err.match( /!BEGIN!/g ) ) {

			// Notify the callback that wants to know if we successfully started
			if (startupCallBack) {
				
				startupCallBack( null );
				// Now it won't ever have to be called again
				startupCallBack = null;
			}

		} else {
			// If it's still listening, notify of error
			if (startupCallBack) {
				startupCallBack(err);
			}

			// TODO: Shut down someway? And let the manager know?

			// Send status code and end recipient?
			// No, I want to implement the Writable Stream interface,
			// no specific HTTP request stuff
			if (self.recipient) {

				// Let manager.js know that there was an error
				self.recipient.emit('generr', Error("Generator.py raised an error:\n" + err) );

				// Check for existence to avoid error
				if (self.recipient) {
					// If manager.js didn't do it already, end the recipient
					self.recipient.end();
				}
			}

			debug.error("\n\n" +
				"################################ Python Error:  ################################\n"
				+ err);

		}
	// Bind!
	}.bind(this) );


	/* ## We're not attaching to stdio[3] here, as that's done by piping the response
	 *    object through when receiving a command
	 */
}


// CAD manipulation functionality
// ------------------------------

// ## Return FreeCAD.ActiveDocument.exportGraphviz()
Generator.prototype.getGraphviz = function ( dest ) {
	self._sendCmd('getGraphviz');

	// Pipe stdio[3]
	self._pipe( dest );
}

// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function ( dest ) {
	self._sendCmd('getContent');

	// Pipe stdio[3]
	self._pipe( dest );
}


// ## Return tessellation of entire object
Generator.prototype.getTessellation = function ( dest, accuracy ) {
	self._sendCmd('getTessellation', {accuracy: accuracy} );

	// Pipe stdio[3]
	self._pipe(dest);
}


// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	self._sendCmd( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );

	// Don't pipe stdio[3], changeParam has no response
}

// ## Kill process
Generator.prototype.kill = function() {
	// .kill() is a child process method
	return self.gen.kill(); // Returns true if successful?
}

// # Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;