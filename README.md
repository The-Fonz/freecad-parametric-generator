freecad-parametric-generator
============================

A standalone *FreeCAD* parametric part editor designed to be run by other programs in order to manipulate a model's parameters and spit out *Three.js* compatible *JSON* models (or other files like `.STL`).

It bridges the gap between pure scripting parametric approaches like [*OpenSCAD*](http://www.openscad.org) and pure GUI parametric approaches found in most CAD software like *SolidWorks*, because you can use the *FreeCAD* GUI to make the models, and then use this *freecad-parametric-generator* to programatically edit this model.

### What it does ###
It takes a `.FCStd` file and manipulates part parameters, just like you'd do in the *FreeCAD* GUI. It can then spit out the model in a variety of formats. It's designed to be spawned and controlled by another program, and it uses `stdin`/`stdout` to communicate with this 'parent' program.

### How it does what it does ###

### Components ###
`generator.py` is the main program that does all the heavy lifting and can be spawned as child process of some program.

`generator.js` is a *Node.js* module to control a `generator.py` instance.

### How to use ###
The spec and Node implementation require some Node packages. So first run `npm install`.