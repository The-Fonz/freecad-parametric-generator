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
	// Queue with defer objects
	self._defs = [];

	// If no timeout given, use standard
	if (timeout) {
		// Quick hack alarm! Is nicer if it's not global
		PROMISE_TIMEOUT = timeout;
	}
}


// Utility functions
// -----------------

// ## Easily handle making promises,
//    adding them to queue and sending command
Generator.prototype._defer = function( type, options ) {
	console.log("_defer called, type:"+type+"\n");
	var d = when.defer();
	// Set type (string) and options
	d.type = type;
	d.options = options;
	
	// Attach sending handler to defer obj
	d.send = function() {
		console.log( 'Command "'+this.type+'" sent\n');
		self._inCmd( this.type, this.options );
	}

	// If no promises are waiting...
	if ( self._defs.length === 0 ) {
		// Send command
		d.send();
		// Notify listeners (depends on handler's implementation if this is used)
		d.notify('sent');
	}

	// Remember defer object by adding it to beginning of queue
	self._defs.unshift( d );

	// Make promise 'expire'
	setTimeout( function( d ) {
		// Message for testing
		//var msg = "Promise timed out after "+PROMISE_TIMEOUT+"ms\n";
		//console.log(msg);
		// Is only sent when not yet resolved/rejected
		d.reject(new Error( msg ));
		// Set a marker
		d.expired = true;
		// Now remove it from queue by looking for this marker
		// (only successful if it's still in queue of course)
		for (var i=0; i< self._defs.length; i++) {
			var d = self._defs[i];
			// Check for expired marker
			if ( d.expired ) {
				self._defs.remove( i ); // Custom array remove method.
			}
		}
	}, PROMISE_TIMEOUT, d ); // Note passing of argument

	return d;
}

// ## Array Remove - By John Resig (MIT Licensed)
// For removing defers from array
// Note: if removing an index that is larger than the array,
// the array gets appended with undefineds
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

// ## Loads cad file, spawns generator, attaches handlers to stderr and stdout
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

		console.log("dataCb called, first 80 chars:\n"+data.slice(0,80)+"\n");

		// Parse data from string to json
		var jd = JSON.parse( data );
		console.log("Parsed JSON\n");

		// Go over all remembered promises
		for (var i=0; i< self._defs.length; i++) {

			var d = self._defs[i]; // Easy access

			// Check if incoming data has same type as promise
			if ( d.type === jd.type ) {
				console.log("Type '"+d.type+"' matched\n");
				console.log("Resolving defer\n");
				d.resolve( jd.data );
				self._defs.remove( i ); // Custom array remove method.
			}
		}

		// To avoid message pileup, send next message here, LIFO style.
		// A timeout is already set on defers when making them using self._defer()
		// (Theoretically, 1000's of tessellations could be requested,
		//  keeping generator.py occupied for hours.)
		if ( self._defs.length > 0 ) {
			var d = self._defs[0]; // LIFO style if unshift() is used when remembering promise
			d.send(); // Call .send() method attached by self._defer()
		}
	}

	// ### Instantiate generator process. [ pythonPath generator.py somecadfile.xx ]
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );

	// ### Attach one global stderr listener
	self.gen.stderr.on('data', function (err) {
		errCb( err );
	});

	var buff = "";

	// ### Attach one global stdout listener
	self.gen.stdout.on('data', function ( data ) {

		buff += data;

		// Quick hack!
		//data = buff;

		if ( data.match(/\}$/) ) {

			console.log("Ends with '}', processing data\n");

			if ( data.match(/^{/) ) {
				dataCb( buff );
			} else { // If first line ain't JSON...
				// Try to extract JSON
				var first = buff.indexOf('{'); // Returns -1 if not found
				// There's a problem here!
				var last  = buff.lastIndexOf('}');
				console.log("Last indexOf: " + last)
				//var last = data.length - 1;
				
				if ( (first !== -1) && (last !== -1) ) {
					var s = buff.slice( first, last+1 ); // Include last character
					console.log("Length of buff: " + buff.length);
					//console.log(somedata);
					console.log("JSON extracted, first 80 chars:\n"+s.slice(0,80)+"\n");
					//console.log("Original data: "+data);
					dataCb( s );
				}
			}
		} else {
			console.log("Not processing data, doesn't end with '}'");
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

	// Return promise
	return d.promise;
}

// ## Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function (  ) {
	var d = self._defer('getContent');

	return d.promise;
}

// ## Return tessellation of entire object
// Quite hard, because some joins might have to be performed
// Look at the FreeCAD example on the FreeCAD website!
Generator.prototype.getTessellation = function ( accuracy ) {
	var d = self._defer('getTessellation', {accuracy: accuracy} );

	return d.promise;
}

// ## Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	var d = self._defer( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );

	return d.promise;
}

// ## Kill process
Generator.prototype.kill = function() {
	// .kill() is a child process method
	return self.gen.kill(); // Returns true if successful?
}

// # Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;