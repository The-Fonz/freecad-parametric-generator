/*
 * This is the Node class to handle generator.py processes.
 */

var spawn = require('child_process').spawn;
var when  = require('when'); // Promises


// Class constructor
// -----------------

Generator = function ( pythonPath, pyGenPath ) {
	self = this;
	// Define all class variables
	self.pythonPath = pythonPath;
	self.pyGenPath  = pyGenPath;
	self.gen = null;
	// Queue with defer objects
	self._defs = [];
}


// Utility functions
// -----------------

// ## Easily make defers with type
Generator.prototype._defer = function( type ) {
	console.log("_defer called, type:"+type+"\n");
	var d = when.defer();
	// Set type (string)
	d.type = type;
	// Remember defer object!
	self._defs.push( d );
	return d;
}
// ## Array Remove - By John Resig (MIT Licensed)
// For removing defers from array
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
// ## Internal utility method to construct messages
Generator.prototype._msgCmd = function( command, options ) {
	var msgJson = JSON.stringify({
		type: 'command',
		command: command, // Accept any 'options' value
		options: typeof options !== 'undefined' ? options : null // No options needed for this command.
	});
	return msgJson;
}
// ## Internal utility method to send messages on stdin
Generator.prototype._in = function ( msg ) {
	var NEWLINE = '\n'; // Python uses this as newline character
	return self.gen.stdin.write( msg + NEWLINE ); // Returns true if flushed
}
// ## Internal utility method to construct and send msgs on stdin
Generator.prototype._inCmd = function( command, options ) {
	return self._in( self._msgCmd( command, options) );
};


// Initialization function
// -----------------------

// ## Loads cad file and spawns generator
Generator.prototype.init = function ( filePath ) {
	// Error callback
	function errCb ( err ) {
		console.error("Python Error:\n"+err)
		while ( self._defs.length ) { // While array `a` has items
			// Or pop(), doesn't matter, now we're rolling FIFO
			var d = self._defs.shift();
			console.log("Rejecting defer, type: "+d.type+"\n");
			// Reject the defer
			d.reject( new Error("Some error in generator.py occurred, here it is:\n" + err) );
		}
	}
	// Data callback
	function dataCb ( data ) {
		console.log("dataCb called, first 40 chars:\n"+data.slice(0,40)+"\n");
		// Parse data from string to json
		var jd = JSON.parse( data );
		console.log("Parsed\n");
		// Go over all remembered promises
		for (var i=0; i< self._defs.length; i++) {
			var d = self._defs[i]; // Easy access
			// Check if incoming data has same type as promise
			if ( d.type === jd.type ) {
				console.log("Type '"+d.type+"' matched\n");
				console.log("Resolving defer\n");
				d.resolve( jd.data );
				self._defs.remove( i ); // Custom remove method.
			}
		}
		// Idea: to avoid message pileup, send next message here? (LIFO?)
		// Timeouts could be set on the promises, so if it takes really long,
		// promises will simply expire and not pile up.
		// (Theoretically, 1000's of tessellations could be requested,
		//  keeping generator.py occupied for hours.)
	}

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );

	// ### Attach one global stderr listener
	self.gen.stderr.on('data', function (err) {
		errCb( err );
	});
	// ### Attach one global stdout listener
	self.gen.stdout.on('data', function (data) {
		// If data starts with '{' it's probably a JSON object
		if ( data.match(/^{/) ) {
			dataCb( data );
		} else { // If first line ain't JSON...
			// Try to extract JSON
			var first = data.indexOf('{'); // Returns -1 if not found
			var last  = data.lastIndexOf('}');
			if ( (first !== -1) && (last !== -1) ) {
				var s = data.slice( first, last+1 ); // Include last character
				console.log("JSON extracted:\n"+s+"\n");
				dataCb( s );
			}
		}
	});
	// Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdout.setEncoding( enc );
	self.gen.stdin.setEncoding( enc );
	// Make defer using utility method
	var d = self._defer('init');
	// Return promise so caller can see if init was successful
	return d.promise;
}

// CAD manipulation functionality
// ------------------------------

// ## Return FreeCAD.ActiveDocument.exportGraphviz()
Generator.prototype.exportGraphviz = function (  ) {
	var d = self._defer('exportGraphviz'); // Make defer obj with type
	// Send command
	self._inCmd( 'exportGraphviz' );
	// Return promise
	return d.promise;
}
// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function (  ) {
	var d = self._defer('getContent');
	self._inCmd( 'getContent' );
	return d.promise;
}
// ## Return tessellation of entire object
// Quite hard, because some joins might have to be performed
// Look at the FreeCAD example on the FreeCAD website!
Generator.prototype.getTessellation = function ( accuracy ) {
	var d = self._defer('getTessellation');

	self._inCmd( 'getTessellation', {accuracy: accuracy} );

	return d.promise;
}
// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	var d = self._defer( 'changeParam' );
	self._inCmd( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );

	return d.promise;
}
// ## Kill process
Generator.prototype.kill = function() {
	return self.gen.kill(); // Returns true if successful?
}

// # Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;