/*
 * This is a thin and 'dumb' wrapper to communicate with `generator.py` processes.
 * It doesn't do much more than send commands to `generator.py` and pipe the output
 * back to the recipient. Its smartest feature is how it detects end of transmission:
 * it listens for '!ENDSTREAM!' strings on stderr (a new way like this is needed
 * as stdout is piped through without listening).
 */

var spawn = require('child_process').spawn;

var NEWLINE = require('os').EOL;

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

	console.log("COMMAND SENT: " + msg);
	
	return self.gen.stdin.write( msg + NEWLINE );
};


// ## Pipe generator.py output to recipient
Generator.prototype._pipe = function ( destinationStream ) {
	// Remember recipient
	self.recipient = destinationStream;

	// Pipe stdout of generator.py to the destination Writable Stream
	self.gen.stdout.pipe( destinationStream );
}


// Initialization function
// -----------------------

// ## Loads cad file, spawns generator, attaches handlers to stderr and stdout
// The callback is notified on successful startup.
Generator.prototype.init = function ( filePath, startupCallBack ) {

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );

	// ### Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdout.setEncoding( enc );
	self.gen.stdin.setEncoding( enc );

	// ### Remember the current recipient of generator.py stdout
	self.recipient = null;

	// ### Attach one global stderr listener. Stderr functions as message passing so
	// stdout can be used just for piping.
	self.gen.stderr.on('data', function (err) {

		// If it contains "!ENDSTREAM!" it actually means that the data has ended,
		// and we can close the receiving stream.
		if ( err.match(/!ENDSTREAM!/g) ) {

			if (self.recipient) {

				// Unpipe?

				// End stream
				self.recipient.end();

				// Clear recipient
				self.recipient = null;
			} else {
				// Weird! Recipient doesn't exist.
				//throw Error("Recipient doesn't exist!");
				console.error( "Recipient doesn't exist!" );
			}

		} else if ( err.match( /!BEGIN!/g ) ) {
			// Generator.py sends '!BEGIN!' on stderr when successfully initialized

			// Now flush stdout to remove init data
			var o = self.gen.stdout.read();
			console.log("\n\n" +
				"############################## Flushing stdout: ################################\n"
				+ o );

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
				self.recipient.end();
			}

			// Can't do this, or jasmine will stall
			//throw Error("Python Error:\n" + err);
			// Print instead
			console.error("\n\n" +
				"################################ Python Error:  ################################\n"
				+ err);

		}
	});


	/* ## We're not attaching to stdout here, as that's done by piping the response
	 *    object through when receiving a command
	 */
}


// CAD manipulation functionality
// ------------------------------

// ## Return FreeCAD.ActiveDocument.exportGraphviz()
Generator.prototype.getGraphviz = function ( dest ) {
	self._sendCmd('getGraphviz');

	// Pipe stdout
	self._pipe( dest );
}

// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function ( dest ) {
	self._sendCmd('getContent');

	// Pipe stdout
	self._pipe( dest );
}


// ## Return tessellation of entire object
Generator.prototype.getTessellation = function ( dest, accuracy ) {
	self._sendCmd('getTessellation', {accuracy: accuracy} );

	// Pipe stdout
	self._pipe(dest);
}


// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	self._sendCmd( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );

	// Don't pipe stdout, changeParam has no response
}

// ## Kill process
Generator.prototype.kill = function() {
	// .kill() is a child process method
	return self.gen.kill(); // Returns true if successful?
}

// # Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;