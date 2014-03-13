freecad-parametric-generator
============================

A standalone *FreeCAD* parametric part editor designed to be run by other programs in order to manipulate a model's parameters and spit out *Three.js* compatible *JSON* models (or other files like `.STL`).

It bridges the gap between pure scripting parametric approaches like [*OpenSCAD*](www.openscad.org) and pure GUI parametric approaches found in most CAD software like *SolidWorks*, because you can use the *FreeCAD* GUI to make the models, and then use this *freecad-parametric-generator* to programatically edit this model.

### What it does ###
It takes a `.FCStd` file and manipulates part parameters, just like you'd do in the *FreeCAD* GUI. It can then spit out the model in a variety of formats. It's designed to be spawned and controlled by another program, and it uses `stdin`/`stdout` to communicate with this 'parent' program.

### How it does what it does ###

### How to use ###
