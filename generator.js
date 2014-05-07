/*
 * This is a thin and 'dumb' wrapper to communicate with `generator.py` processes.
 * It doesn't do much more than send commands to `generator.py` and pipe the output
 * back to the recipient. Its smartest feature is how it detects end of transmission:
 * it listens for '!ENDSTREAM!' strings on stderr (a new way like this is needed
 * as stdout is piped through without listening).
 */

var spawn = require('child_process').spawn;


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

	var NEWLINE = '\n'; // Python uses this as newline character

	var msg = JSON.stringify({
		type: 'command',
		command: command, // Accept any 'options' value
		options: typeof options !== 'undefined' ? options : null // No options needed for this command.
	});

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
Generator.prototype.init = function ( filePath ) {

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );

	// ### Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdout.setEncoding( enc );
	self.gen.stdin.setEncoding( enc );

	// ### Remember the current recipient of generator.py stdout
	self.recipient = null;

	// ### Attach one global stderr listener
	self.gen.stderr.on('data', function (err) {

		// If it contains "!ENDSTREAM!" it actually means that the data has ended,
		// and we can close the receiving stream.
		if ( err.match(/!ENDSTREAM!/g) ) {

			if (self.recipient !== null) {

				// Unpipe?

				// End stream
				self.recipient.end();

				// Clear recipient
				self.recipient = null;
			} else {
				// Weird! Recipient doesn't exist.
				throw Error("Recipient doesn't exist!");
			}

		} else {
			// Send status code and end recipient?
			// No, I want to implement the Writable Stream interface,
			// no specific HTTP request stuff
			self.recipient.end();

			throw Error("Python Error:\n" + err);
			//console.error("Python Error:\n" + err);

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
	self._inCmd('getGraphviz'); // Make defer obj with type

	// Pipe stdout
	self._pipe( dest );
}

// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function ( dest ) {
	self._inCmd('getContent');

	// Pipe stdout
	self._pipe( dest );
}


// ## Return tessellation of entire object
Generator.prototype.getTessellation = function ( dest, accuracy ) {
	self._inCmd('getTessellation', {accuracy: accuracy} );

	// Pipe stdout
	self._pipe(dest);
}


// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	self._inCmd( 'changeParam', { // Command type, options
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