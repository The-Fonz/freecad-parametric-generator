#
# All routes
#

# Dependencies
import utils
import ThreeJson

import sys
import FreeCAD


def getGraphviz():
	'''Returns the graphviz in exported format (as opposed to .DependencyGraph).'''
	data = FreeCAD.ActiveDocument.exportGraphviz()
	utils.output(data)

def getContent():
	'''Returns the right metadata.'''
	data = FreeCAD.ActiveDocument.Content
	utils.output(data)

def getTessellation( tolerance ):
	'''Returns tessellation with specified tolerance.'''
	# Don't fuse all objects before tessellating, just tessellate all visible objects
	visibleObjs = []
	#raise Warning("FreeCADGui dir:\n", dir(FreeCADGui))
	for obj in FreeCAD.ActiveDocument.Objects: # For all objects in document
		# Dirty solution; getActiveObjs reads a filename as zipfile and then extracts GuiDocument.xml...
		visObjNames = utils.getActiveObjs( FreeCAD.ActiveDocument.FileName )
		
		if obj.Name in visObjNames:
			visibleObjs.append( obj )

	vertices = []; nVertices = 0;
	faces = []; nFaces = 0;

	for obj in visibleObjs:
		# The below inspired by: https://github.com/dcowden/cadquery/blob/master/cadquery/freecad_impl/exporters.py
		# (originall adapted from that code but made functional instead of OO
		# to avoid method call overhead as there are MANY vertices)

		# Switch statement to check which type of object it is
		# Inspired by https://github.com/danielfalck/freecadweb/blob/master/examples/springmaker/exportWebGL.py
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

		# If we're not dealing with a mesh, go tessellate the shape
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
			vertices.extend( [vec.x, vec.y, vec.z] )

		# For faces, we need to differentiate between meshes and parts,
		# mesh face indices are not subscriptable but are accessed with .PointIndices
		# We assume that all faces are triangles (but to be sure raise a warning otherwise).
		for face in objFaces:

			nFaces += 1

			# If triangle
			if len(face) == 3:
				TYPE = 0 # To indicate triangle (see three.js JSON object notation spec)

				# `if` statement here to avoid ugly duplicate code in the form of two for loops!
				# But checking this boolean each time this might cost speed, don't know how much...
				if bMesh:
					face = face.PointIndices # face.PointIndices is a tuple
				# Are int() casts necessary here? I left them out.
				faces.extend( [ TYPE, face[0],face[1],face[2] ] )
			else:
				raise Warning("This face is no triangle, it has length %s" % len(face) )

	data = ThreeJson.tessToJson( vertices, faces, nVertices, nFaces )
	
	utils.output(data)


def changeParam( objName, param, val ):
	'''Changes parameter of object with specified name.'''

	fcobj = FreeCAD.ActiveDocument.getObject( objName )

	# Test if val is a number
	try:
		val = float(val)

	except ValueError:
		raise Warning("Can't cast value to float")


	# If object exist in current document
	if fcobj:

		try:
			# Builtin python function to set obj param per object *namestring*
			# The goal of this entire function
			setattr( fcobj, param, val )

		# Setattr throws TypeError when type of attribute does not match
		# Let's try to set it as an int then (e.g. for array features)
		except TypeError:
			setattr( fcobj, param, int(val) )

		except AttributeError: # Uh oh, the object doesn't have the attribute!
			raise Warning("Object doesn't have the sought attribute")

	else: # Is raising a warning for this a good idea?
		raise Warning("Object doesn't exist in current document")