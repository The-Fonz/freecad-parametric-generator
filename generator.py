"""
	This script contains all code required to run the standalone FreeCAD 'generator'.
	It communicates with the parent process using stdin, stdout and stderr.
	Message passing is done using JSON objects. The structure is as follows:
	## Incoming message (command) ##
	{
		type: command, # command is the only type for now
		command: returnTessellation
		options: {
			tolerance: .1 # Required if command === returnTessellation
		}
	}
"""

# Imports
import sys
import json # For JSON parsing. Use json.load( fileobj ), not .loads( str )
import time
import FreeCAD # Prints init info to sys.stdout, can flush to return the data
sys.stdout.flush() # Flush FreeCAD's init info
# Custom files
import Routes

# Routes the command to the right function
def commandRouter( lineJson ):
	cmd = lineJson['command'] # Easy access
	opt = lineJson['options'] # Easy access
	# Make `case`-like functionality with if/elif checks
	if cmd == "getContent":
		Routes.getContent()
	elif cmd == "getGraphviz":
		Routes.getGraphviz()
	elif cmd == "getTessellation":
		acc = opt['accuracy'] # Throws KeyError
		Routes.getTessellation( acc )
	elif cmd == "changeParam":
		objName = opt['objName']
		param = opt['param']
		val = opt['val']
		Routes.changeParam( objName, param, val )
	else:
		# if not matched, throw error? 
		pass

if __name__ == "__main__":
	try:
		sys.argv[1] # First argument (sys.argv[0] is path)
	except IndexError:
		raise Warning("No filename passed in")

	try:
		DOCUMENT = FreeCAD.openDocument ( sys.argv[1] ) # Throws I/O Error
		# Flag to signal that no more shit will be printed on stdout
		sys.stdout.write("!BEGIN!")
		sys.stdout.flush() # Flush FreeCAD's load info
	except IOError:
		raise Warning("Invalid or non-existing file %s" % sys.argv[1])

	# Main loop. Using an infinite loop is fine, as the parent process can kill this one.
	while 1:
		# sys.stdin.readline() happily blocks
		lineJson = json.loads( sys.stdin.readline() ) # json.loads can throw an error

		if lineJson['type'] == 'command':
			commandRouter( lineJson )