#
# Adapted from https://github.com/dcowden/cadquery/blob/master/cadquery/freecad_impl/exporters.py
#     Objects that represent
#     three.js JSON object notation
#     https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3
#
def tessToJson( vert, face, nvert, nface):
    '''Specify compatible lists of vertices and faces,
    and get a three.js JSON object back. Note: list of face indices
    must be compatible, i.e. lead with 0 for each row of 3 indices
    to create a triangle. Spec:
    https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3'''
    return JSON_TEMPLATE % {
        'vertices' : str(vert),
        'faces' : str(face),
        'nVertices': nvert,
        'nFaces' : nface
    };

JSON_TEMPLATE= """\
{
    "metadata" :
    {
        "formatVersion" : 3,
        "generatedBy"   : "ParametricParts",
        "vertices"      : %(nVertices)d,
        "faces"         : %(nFaces)d,
        "normals"       : 0,
        "colors"        : 0,
        "uvs"           : 0,
        "materials"     : 1,
        "morphTargets"  : 0
    },

    "scale" : 1.0,

    "materials": [    {
    "DbgColor" : 15658734,
    "DbgIndex" : 0,
    "DbgName" : "Material",
    "colorAmbient" : [0.0, 0.0, 0.0],
    "colorDiffuse" : [0.6400000190734865, 0.10179081114814892, 0.126246120426746],
    "colorSpecular" : [0.5, 0.5, 0.5],
    "shading" : "Lambert",
    "specularCoef" : 50,
    "transparency" : 1.0,
    "vertexColors" : false
    }],

    "vertices": %(vertices)s,

    "morphTargets": [],

    "normals": [],

    "colors": [],

    "uvs": [[]],

    "faces": %(faces)s
}
"""