# Dependencies
import sys
import json

class Msg:
	'''A message object for easy handling of JSON stdout
	messages, and to avoid deep copy issues arising when using simple templates.'''

	# Constructor with no arguments means just initializing
	def __init__(self, type=None, data=None):
		'''Message constructor. Call with arguments to make the message, then send
		using msg.stdoutDump(). Or call without arguments to just create the object,
		then use msg.msg['type'] and msg.msg['data'] to set message parts.'''
		self.msg = {
			'type': type, # Change this to reflect the current type
			'data': data
		}

	def stdoutDump(self):
		'''Convert message (type: python dict) to json and send it on stdout.'''
		# Write to stdout in json format
		sys.stdout.write( json.dumps(self.msg) )
		# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.
		sys.stdout.flush()