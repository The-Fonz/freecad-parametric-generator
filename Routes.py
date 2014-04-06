"""
All routes
"""

# Dependencies
import ThreeJson
from Msg import Msg
import FreeCAD

# Returns the graphviz in exported format (as opposed to .DependencyGraph)
def exportGraphviz():
	data = FreeCAD.ActiveDocument.exportGraphviz()
	msg = Msg('exportGraphviz', data )
	msg.stdoutDump()

# Returns the right metadata
def getContent():
	msg = Msg()
	msg.msg['type'] = 'getContent'
	msg.msg['data'] = FreeCAD.ActiveDocument.Content
	msg.stdoutDump()

# Returns tessellation
def getTessellation( tolerance ):
	# Don't fuse all objects before tessellating, just tessellate all visible objects
	visibleObjs = []
	#raise Warning("FreeCADGui dir:\n", dir(FreeCADGui))
	for obj in FreeCAD.ActiveDocument.Objects: # For all objects in document
	# NOTE: FreeCADGui works slightly different from the Gui in FreeCAD itself
		#if FreeCADGui.activeDocument().getObject( obj.Name ): # If visible
			visibleObjs.append( obj )
	
	# Inspired by https://github.com/dcowden/cadquery/blob/master/cadquery/freecad_impl/exporters.py
	# Made functional to avoid function call overhead (there's MANY vertices...)
	vertices = []; nVertices = 0;
	faces = []; nFaces = 0;

	for obj in visibleObjs:
		shape = FreeCAD.ActiveDocument.getObject( obj.Name ).Shape
		try:
			# Returns tuple with two lists: first is vertices, second is faces
			tess = shape.tessellate( tolerance )
		except TypeError:
			raise Warning("Accuracy parameter is of the wrong type")

		#add vertices
		for vec in tess[0]:
			nVertices += 1
			vertices.extend([vec.x, vec.y, vec.z])

		#add faces
		for f in tess[1]:
			#first position means justa simple triangle
			nFaces += 1
			# Notice the leading 0!
			faces.extend( [ 0, int(f[0]), int(f[1]), int(f[2]) ] )
	
	msg = Msg()
	msg.msg['type'] = 'getTessellation'
	msg.msg['data'] = ThreeJson.tessToJson( vertices, faces, nVertices, nFaces )
	msg.stdoutDump()


# Changes parameter
def changeParam( objName, param, val ):
	fcobj = FreeCAD.ActiveDocument.getObject( objName )
	try: # Test if val is a number
		val = float(val)
	except ValueError:
		# Is it wise to raise so many warnings?
		raise Warning("Can't cast value to float")
	if fcobj: # If object exist in current document
		try:
			# Builtin python function to set obj param per object name string
			setattr( fcobj, param, val ) # The goal of this entire function
			# If the above did not throw an error...
			msg = Msg('changeParam') # Only set type, no data needed
			msg.stdoutDump()
		except AttributeError: # Uh oh, the object doesn't have the attribute!
			raise Warning("Object doesn't have the sought attribute")
	else: # Is raising a warning for this a good idea?
		raise Warning("Object doesn't exist in current document")