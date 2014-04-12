"""
All routes
"""

# Dependencies
import utils
import ThreeJson
from Msg import Msg
import FreeCAD

def exportGraphviz():
	'''Returns the graphviz in exported format (as opposed to .DependencyGraph)'''
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
		# Dirty solution; getActiveObjs reads a filename as zipfile and then extracts GuiDocument.xml...
		visObjNames = utils.getActiveObjs( FreeCAD.ActiveDocument.FileName )
		print visObjNames
		if obj.Name in visObjNames:
			visibleObjs.append( obj )
	
	# Inspired by https://github.com/dcowden/cadquery/blob/master/cadquery/freecad_impl/exporters.py
	# Made functional to avoid function call overhead (there's MANY vertices...)
	vertices = []; nVertices = 0;
	faces = []; nFaces = 0;

	for obj in visibleObjs:
		# Switch statement to check which type of object it is
		if obj.isDerivedFrom("Part::Feature"): # Standard case
		    shape = obj.Shape
		    bMesh = False
		elif obj.isDerivedFrom("Part::TopoShape"):
		    shape = obj
		    bMesh = False
		elif obj.isDerivedFrom("Mesh::Feature"):
			objVertices = obj.Mesh.Points
			objFaces = obj.Mesh.Facets
			bMesh = True
		else:
			raise Warning("Object type not recognised.")

		# If we're not dealing with a mesh
		if shape:
			try:
				# Returns tuple with two lists: first is vertices, second is faces
				tess = shape.tessellate( tolerance ) # Throws TypeError
				objVertices = tess[0]
				objFaces = tess[1]
			except TypeError:
				raise Warning("Accuracy parameter is of the wrong type")

		# Add vertices, assuming all vertices define triangles
		for vec in objVertices:
			nVertices += 1
			# Accessing with .x, .y and .z also works for meshes
			vertices.extend([vec.x, vec.y, vec.z])

		# For faces, we need to differentiate between meshes and parts,
		# mesh face indices are not subscriptable but are accessed with .PointIndices
		# We assume that all faces are triangles.
		for face in objFaces:
			nFaces += 1
			if len(face) == 3: # If triangle
				TYPE = 0 # To indicate triangle (see format spec)
				# Mesh faces must be accessed by .PointIndices
				# If statement here to avoid ugly duplicate code in the form of two for loops!\
				# But this might cost speed, I don't know...
				if bMesh:
					face = face.PointIndices # face.PointIndices is a tuple
				# Are int() casts necessary here? I left them out.
				faces.extend( [ TYPE, face[0],face[1],face[2] ] )
			else:
				raise Warning("This face is no triangle, it has length %s" % len(face) )
	
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