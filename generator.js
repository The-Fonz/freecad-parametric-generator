/*
 * This is the Node class to handle generator.py processes.
 */

var spawn = require('child_process').spawn;
var when  = require('when'); // Promises

// Promise timeout constant
// ------------------------
var PROMISE_TIMEOUT = 60000; // ms

// Class constructor
// -----------------

Generator = function ( pythonPath, pyGenPath, timeout ) {
	self = this;
	// Define all class variables
	self.pythonPath = pythonPath;
	self.pyGenPath  = pyGenPath;
	self.gen = null;

	// If no timeout given, use standard
	if (timeout) {
		// Quick hack alarm! Is nicer if it's not global
		PROMISE_TIMEOUT = timeout;
	}
}


// Utility functions
// -----------------

// ## Internal utility method to construct and send msgs on stdin
Generator.prototype._inCmd = function( command, options ) {

	var NEWLINE = '\n'; // Python uses this as newline character

	var msg = JSON.stringify({
		type: 'command',
		command: command, // Accept any 'options' value
		options: typeof options !== 'undefined' ? options : null // No options needed for this command.
	});

	return self.gen.stdin.write( msg + NEWLINE );
};


// Initialization function
// -----------------------

// ## Loads cad file, spawns generator, attaches handlers to stderr and stdout
Generator.prototype.init = function ( filePath ) {

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );

	// ### Remember the current recipient of generator.py stdout
	self.recipient = null;

	// ### Attach one global stderr listener
	self.gen.stderr.on('data', function (err) {

		// If it contains "!ENDSTREAM!" it actually means that the data has ended,
		// and we can close the receiving stream.
		if ( err.match(/!ENDSTREAM!/g) ) {

			if (self.recipient !== null) {

				self.recipient.end();

				self.recipient = null;
			} else {
				// Weird! Recipient doesn't exist.
				throw Error("Recipient doesn't exist!")
			}

		} else {
			console.error("Python Error:\n" + err);

			// End recipient or someting...
		}
	});

	// Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdout.setEncoding( enc );
	self.gen.stdin.setEncoding( enc );
}

// Pipe generator.py output to recipient
Generator.prototype.pipe = function ( dest ) {
	self.recipient = dest;
	self.gen.stdout.pipe( dest );
}


// CAD manipulation functionality
// ------------------------------

// ## Return FreeCAD.ActiveDocument.exportGraphviz()
Generator.prototype.getGraphviz = function ( dest ) {
	self._inCmd('getGraphviz'); // Make defer obj with type

	// Pipe stdout
	self.pipe( dest );
}

// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function ( dest ) {
	self._inCmd('getContent');

	// Pipe stdout
	self.pipe( dest );
}


// ## Return tessellation of entire object
Generator.prototype.getTessellation = function ( dest, accuracy ) {
	self._inCmd('getTessellation', {accuracy: accuracy} );

	// Pipe stdout
	self.pipe(dest);
}


// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	self._inCmd( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );
}

// ## Kill process
Generator.prototype.kill = function() {
	// .kill() is a child process method
	return self.gen.kill(); // Returns true if successful?
}

// # Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;