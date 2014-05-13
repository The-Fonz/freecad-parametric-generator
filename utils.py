#
# This file contains all utility functions.
#

import zipfile
import xml.etree.ElementTree as ET

import os
import sys

# Message to write on stderr that signals end of message
ENDSTREAMFLAG = "!ENDSTREAM!"

# Open file descriptor 3 (next to stdin/out/err)
# It's VERY important to set 'bufsize' to 0 (unbuffered), otherwise the system default
# is used and the output is cut off. Unbuffered seems to work perfectly.
fd3 = os.fdopen( 3, 'w', 0 )

def output( data ):
    '''Write `data` to stdout, flush, and write !ENDSTREAM! on stderr.'''    
    fd3.write( data )
    fd3.flush()

    sys.stderr.write( ENDSTREAMFLAG )
    sys.stderr.flush()

def getActiveObjs( filename ):
    '''Pass a FreeCAD file to this function and 
    receive back a list of the visible objects.
    Adapted from: https://raw.githubusercontent.com/danielfalck/freecadweb/master/examples/upload/drawit.py'''
    zfile = zipfile.ZipFile(filename)
    #find out which objects were left visible in the saved file
    gui=zfile.read('GuiDocument.xml')
    guitree = ET.fromstring(gui)
    objlist = []
    # Note: iter() was deprecated, use getiterator instead
    for viewp in guitree.getiterator(tag = 'ViewProvider'):
        for elem in viewp.getiterator(tag='Properties'):
            for prop in elem.getiterator(tag='Property'):
                if prop.attrib.get('name')=='Visibility':
                   for state in prop.getiterator(tag='Bool'):
                       if state.get('value')=='true':
                            objlist.append( viewp.get('name'))
    return objlist


# Code from: https://raw.githubusercontent.com/danielfalck/freecadweb/master/examples/upload/drawit.py
# def getActiveObjs(filename):
#     '''Pass a FreeCAD file to this function and 
#     receive back a list of the visible objects.'''
#     zfile = zipfile.ZipFile(filename)
#     #find out which objects were left visible in the saved file
#     gui=zfile.read('GuiDocument.xml')
#     guitree = ET.fromstring(gui)
#     objlist = []
#     for viewp in guitree.iter(tag = 'ViewProvider'):
#         for elem in viewp.iter(tag='Properties'):
#             for prop in elem.iter(tag='Property'):
#                 if prop.attrib.get('name')=='Visibility':
#                    for state in prop.iter(tag='Bool'):
#                        if state.get('value')=='true':
#                             objlist.append( viewp.get('name'))
#     #return objlist
#     #get the Brep geometry of visible objects.
#     geom=zfile.read('Document.xml')
#     geotree = ET.fromstring(geom)
#     filelist = []
#     for elem in geotree.iter(tag='ObjectData'):
#         for label in elem.iter(tag='Object'):
#             if label.attrib.get('name') in (tuple(objlist)):
#                 for prop in label.iter(tag='Property'):
#                     if prop.attrib.get('name') == 'Shape':
#                         for part in prop.iter(tag='Part'):
#                             filelist.append(part.attrib.get('file'))
#     return filelist