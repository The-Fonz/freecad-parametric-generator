/*
 * This is the Node class to handle generator.py processes.
 */

var spawn = require('child_process').spawn;
var when  = require('when'); // Promises

// Class constructor
Generator = function ( pythonPath, pyGenPath ) {
	self = this;
	// Define all class variables
	self.pythonPath = pythonPath;
	self.pyGenPath  = pyGenPath;
	self.gen = null;
}
// Intitialize object and spawn generator
Generator.prototype.init = function ( filePath ) {
	var d = when.defer(); // Set up promise
	// Instantiate generator process.
	// pythonPath generator.py somecadfile.xx
	self.gen = spawn( self.pythonPath, [ self.pyGenPath, filePath ] );
	self.gen.stderr.once('data', function (err) {
		console.log("Generator.prototype.init self.gen.stderr.once listener"+err);
		d.reject(new Error("Generator error on initialization:"+err));
		self.gen.kill(); // Throws error?
	});
	self.gen.stdout.on('data', function (data) {
		// If this is not random info but a JSON object...
		if ( data.match(/{/) ) { // .match(regex) only matches from line start!
			d.resolve( data ); // Started successfully
			self.gen.stderr.removeAllListeners(); // Remove listener above that kills process
			//self.gen.stdout.removeAllListeners(); // GIVES ERROR
		}
	});
	// Set encodings to not have to cast using String() each time
	var enc = 'utf8';
	self.gen.stderr.setEncoding( enc );
	self.gen.stdout.setEncoding( enc );
	self.gen.stdin.setEncoding( enc );
	// Return promise so caller can see if init was successful
	return d.promise;
}
// Internal utility method to construct messages
Generator.prototype._msgCmd = function( command, options ) {
	var msgJson = JSON.stringify({
		type: 'command',
		command: command, // Accept any 'options' value
		options: typeof options !== 'undefined' ? options : null // No options needed for this command.
	});
	return msgJson;
}
// Internal utility method to send messages on stdin
Generator.prototype._in = function ( msg ) {
	var NEWLINE = '\n'; // Python uses this as newline character
	return self.gen.stdin.write( msg + NEWLINE ); // Returns true if flushed
}
// Internal utility method to construct and send msgs on stdin
Generator.prototype._inCmd = function( command, options ) {
	return self._in( self._msgCmd( command, options) );
};
// Return FreeCAD.ActiveDocument.exportGraphviz()
Generator.prototype.exportGraphviz = function (  ) {
	var d = when.defer();
	var msgJson = self._msgCmd( 'exportGraphviz' );
	// Send command
	self._in( msgJson );
	self.gen.stderr.once('data', function( err ) {
		d.reject(new Error("Generator error on exportGraphviz"+err));
	});
	self.gen.stdout.once('data', function( data ) {
		//console.log(String(data));
		d.resolve( data );
	});
	return d.promise;
}
// Return FreeCAD.ActiveDocument.Content
Generator.prototype.getContent = function (  ) {
	var d = when.defer();
	var msgJson = self._msgCmd( 'getContent' );
	self._in( msgJson );
	self.gen.stderr.once('data', function( err ) {
		d.reject(new Error("Generator error on getContent"+err));
	});
	self.gen.stdout.once('data', function( data ) {
		//console.log(String(data));
		d.resolve( data );
	});
	return d.promise;
}
// Return tessellation of entire object
// Quite hard, because some joins might have to be performed
// Look at the FreeCAD example on the FreeCAD website!
Generator.prototype.getTessellation = function ( accuracy ) {
	var d = when.defer();
	self.gen.stderr.once('data', function (err) {
		d.reject(new Error("getTessellation"+err));
	});
	self.gen.stdout.once('data', function (data) {
		d.resolve( data );
	});
	// TESTING: Finding the mysterious bug that prevents the stderr listener above
	// from receiving the error
	var lisc = require('events').EventEmitter.listenerCount
	console.log("# of listeners on stderr: " + lisc(self.gen.stderr, 'data'))
	console.log("Listener: " + String( self.gen.stderr.listeners('data') ) );
	self._inCmd( 'getTessellation', {accuracy: accuracy} );
	return d.promise;
}
// Change parameter
Generator.prototype.changeParam = function( objName, param, val ) {
	var d = when.defer();
	self._inCmd( 'changeParam', { // Command type, options
		objName: objName,
		param: param,
		val: val
	} );
	self.gen.stderr.once('data', function( err ) {
		d.reject(new Error("changeParam"+err));
	});
	self.gen.stdout.once('data', function( data ) {
		changeParamSuccess = 1;
		stat = JSON.parse( data ).status;
		stat = Number(stat); // Necessary?
		if ( stat === changeParamSuccess ) {
			d.resolve();
		} else {
			d.reject();
		}
	});
	return d.promise;
}
// Kill process
Generator.prototype.kill = function() {
	return self.gen.kill(); // Returns true if successful?
}

// Export the class. Needs to be instantiated with `new`.
exports.Generator = Generator;