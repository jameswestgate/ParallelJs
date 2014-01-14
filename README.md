About
-----

Most machines and phones  have at least 2 cpu cores available, however the architecture of all modern browsers is inherently single-threaded. Website and javascript-driven single page applications written for modern browsers can execute code in seperate worker threads however these threads have no access to the DOM. 

Parallel JS is a proof-of-concept library to allow access to the DOM from any worker or shared worker process utilising a familiar jQuery-like syntax. The aims of the library are to provide a seamless and easy entry point into writing multi-process browser code that just works.

Unit Tests
----------

http://jameswestgate.github.io/ParallelJs/test/

Milestones
----------

###version 0.6 - planned

- add basic details to Document such as url
- object serialization / deserialization for Node, NodeList and Document

###version 0.5 - in progress
- external node / nodelist initialisation
- add document ready with optional selector filter
- make sure events are synced to dom queue *
- auto ui.flush *

###version 0.4 - complete

- cleanup source / target creation
- add and remove event handlers

###version 0.3 - complete

- move to split node value container
- add text support
- add each support
- create plug-in api

###version 0.2 - complete

- add / remove nodes
- sync updates to requestAnimationFrame

###version 0.1 - complete

- basic interface
- unit test framework
- add, remove and update element attributes







