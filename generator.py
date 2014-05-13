"""
	This script contains all code required to run the standalone FreeCAD 'generator'.
	It communicates with the parent process using stdin, stdout and stderr.
	Message passing is done using JSON objects. The structure is as follows:
	
	## Incoming message (command) ##
	"{
		type: command, # command is the only type for now
		command: returnTessellation
		options: {
			tolerance: .1 # Required if command === returnTessellation
		}
	}"

	There are two different flags printed to stderr, namely:
	"!BEGIN!" -> Begin flag. Emitted when initialization period is over.
	"!ENDSTREAM!" -> End of data stream on stdout.

	For pretty much everything else, an error is thrown. This prevents any unwanted
	or undefined behaviour, and enables us to easily see where stuff goes wrong.
"""


# Imports
# =======
import utils

import sys

# For JSON parsing. Use `json.load( fileobj )`, not `.loads( str )`
import json

import time

# Prints init info to sys.stdout, can flush to return the data
import FreeCAD
# Flush FreeCAD's init info
#sys.stdout.flush()


# Custom module import
# ====================
import Routes


# Message to write on stderr that signals end of initialization
BEGINFLAG = "!BEGIN!"


def commandRouter( lineJson ):
	"""Routes the command to the right function. Throws `Warning` if
	   command not matched."""

	cmd = lineJson['command']
	opt = lineJson['options']

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
		# if not matched, throw error
		raise Warning("Command not matched")



# If not imported
if __name__ == "__main__":

	try:
		# Get first argument (sys.argv[0] is path), throws IndexError
		fn = sys.argv[1]

		# Open document. Throws I/O Error.
		DOCUMENT = FreeCAD.openDocument ( fn )

		# Flag to signal that no more bullshit (load info) will be printed on stdout
		sys.stderr.write( BEGINFLAG )
		sys.stderr.flush()

	except IndexError:
		raise Warning("No filename passed in")

	except IOError:
		raise Warning("Invalid or non-existing file %s" % sys.argv[1])


	# Main loop. Using an infinite loop is fine, as the parent process can kill this one.
	while 1:
		# sys.stdin.readline() happily blocks
		# json.loads can throw an error
		lineJson = json.loads( sys.stdin.readline() )

		if lineJson['type'] == 'command':
			commandRouter( lineJson )