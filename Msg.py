# Dependencies
import sys
import json

# Let's define a message object for easy handling, and to avoid deep copy issues
class Msg:
	# Constructor with no arguments means just initializing
	def __init__(self, type=None, data=None):
		self.msg = {
			'type': type, # Change this to reflect the current type
			'data': data
		}
	# Convert python object to json and send it on stdout
	def stdoutDump(self):
		# Write to stdout in json format
		sys.stdout.write( json.dumps(self.msg) )
		# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.
		sys.stdout.flush()