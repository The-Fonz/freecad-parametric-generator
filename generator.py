"""
	This script contains all code required to run the standalone FreeCAD 'generator'.
	It communicates with the parent process using stdin, stdout and stderr.
	Message passing is done using JSON objects. The structure is as follows:
	## Incoming message (command) ##
	{
		type: command, # command is the only type for now
		command: returnMetadata | returnTessellation
		options: {
			tolerance: .1 # Required if command === returnTessellation
		}
	}
	## Outgoing message (reply) ##
	{
		status: 0 | # Optional, 0=OK
	}
"""
# Let's define an object with message templates
tmpl = {}
tmpl['stat'] = {
	'status': None # Change this to reflect the current status
}

import sys
import time
import json # For JSON parsing. Use json.load( fileobj ), not .loads( str )
try:
	import FreeCAD
	sys.stdout.flush() # FreeCAD writes some init info. MUST flush to make it a newline
except SystemError:
	pass
	#raise Warning("Error importing FreeCAD")
except ImportError:
	pass
# Checks if file exists
def exists( filepath ):
	import os.path
	# Only print in JSON. This breaks stuff
	#print "Checking if %s exists..." % filepath
	return os.path.isfile( filepath )
# Routes the command to the right function
def commandRouter( cmdmsg ):
	sys.stdout.write( "Command received" )
	sys.stdout.flush()
	# Check what kind of command it is
	# Route to right function
	# if not matched, throw error?
	pass

if __name__ == "__main__":
	try:
		sys.argv[1] # First argument (sys.argv[0] is path)
	except IndexError:
		raise Warning("No filename passed in")
	
	if not exists( sys.argv[1] ):
		raise Warning("File does not exist")

	# Let parent process know we're up and running
	msg = tmpl['stat']; msg['status'] = 0 # Use stat msg template. Status 0 is OK
	sys.stdout.write( json.dumps(msg) )
	#print json.dumps(msg)
	sys.stdout.flush()
	# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.

	# Check every x ms if a command was fired
	while 1: # An infinite loop is fine, as the parent process can kill this one
		# Check for stdin and immediately parse json. sys.stdin.readline() happily blocks
		#UNCOMMENT line = sys.stdin.readline()
		time.sleep(.05) # Check if recipient receives data every 50ms
		sys.stdout.write(" abcd ")
		sys.stdout.flush()
		#lineJson = json.loads( line )
		# json.loads can throw an error
		commandRouter( line )
		# switch (command)
		# default:
		#    sys.stdout.write("UNKNOWN COMMAND").flush()
		#time.sleep(.05) # Unnecessary, line = sys.stdin.readline() happily blocks