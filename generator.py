""" This script contains all code required to run the standalone FreeCAD 'generator'.
"""

import sys
import time

def exists( filepath ):
	import os.path
	print "Checking if %s exists..." % filepath
	return os.path.isfile( filepath )

if __name__ == "__main__":
	try:
		sys.argv[1] # First argument (sys.argv[0] is path)
	except IndexError:
		raise Warning("No filename passed in")
	
	if not exists( sys.argv[1] ):
		raise Warning("File does not exist")

	# Let parent process know we're up and running
	sys.stdout.write("SPINNING").flush()
	# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.

	# Check every x ms if a command was fired
	while 1: # An infinite loop is fine, as the parent process can kill this one
		# Check for stdin
		# switch (command)
		# default:
		#    sys.stdout.write("UNKNOWN COMMAND").flush()
		time.sleep(.05) # Check every x ms, avoid infinite uninterrupted loop