polygons
================

HTML5 polygon drawing support


## Usage


### .paint( data, target )

Paints polygons specified on data into target.

 * data: data structure to paint, see details below
 * target: canvas element ID or canvas element

Simple box example:
```javascript
var polygons = require( "polygons" );
var data = { shape: 'rect', position: [ 10, 10 ], width: 10, height: 10 };
polygons.paint( data, "canvas_element" );
```

Complex example:
```javascript
var polygons = require( "polygons" );
var data = {
  scale: 1.25, offsetX: 10, offsetY: 20, rotationDeg: 45, refPointX: 100, refPointY: 100,
  fillStyle: "blue", strokeStyle: "red", lineWidth: 4,

  refPoints: [ { name: "p1", x: 50, y: 50 }, { name: "p2", x: 200, y: 200 } ],
  shape: 'polygon',
  points: [ [ 10, 300 ], [ "@30", "@30" ], [ "@-30", "@0" ] ],
  childs: [
    { shape: 'polygon', points: [ "p1", [ "@100", "@0" ], { dx: 0, dy: 100 }, { ref: "p1", dx: 0, y: 150 }, "p1" ], fillStyle: null },
    { refPoints: [ { name: "p3", x: 75, y: 200 } ], shape: 'rect', points: [ "p2", [ "@50", "@0" ], [ "@0", "@50" ], [ "@-50", "@0" ], "close" ], lineWidth: 2, fillStyle: "yellow" },
    { shape: 'rect', position: "p3", width: 50, height: 50 }
  ]
};

polygons.paint( data, "canvas_element" );
```

### .getPrimitives( data )

Creates an object containing all primitives required to paint polygons specified on data.

 * data: data structure to paint, see details below

```javascript
var polygons = require( "polygons" );
var data = { shape: 'polygon', points: [ [ 10, 10 ], [ "@10", "@0" ], [ "@0", "@10" ], [ "@-10", "@0" ], "close" ] };
var prim = polygons.getPrimitives( data );
...
prim.paint( "canvas_element" );
```


### Data structure to paint

Supported data types are

 * array: each element of the array is painted in a separate attributes context that inherites attributes from parent object
 * object: each property is processed depending on its name as follows


#### Object properties

 * All canvas attributes: fillStyle, strokeStyle, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, lineCap, lineJoin, lineWidth, miterLimit, font, textAlign and textBaseline

 * scale: Scale for all axis
 * offsetX: Shift for x axis
 * offsetY: Shift for y axis
 * rotation: Rotation angle in radians
 * rotationDeg: Rotation angle in degrees
 * refPointX: Reference point for transformations x axis coordinate
 * refPointY: Reference point for transformations y axis coordinate

 * childs: Contains child objects to be painted, must be an array or an object

 * refPoints: Array of points to be used as reference by polygons, see below
 * shape: characterises the figure, can be 'rect', 'circle', 'arc' and 'polygon'
 * position: used in shapes 'rect', 'circle' and 'arc'
 * height: used in shape 'rect'
 * width: used in shape 'rect'
 * radius: used in shapes 'circle' and 'arc'
 * startAngle: used in shape 'arc'
 * startAngleDeg: used in shape 'arc'
 * endAngle: used in shape 'arc'
 * endAngleDeg: used in shape 'arc'
 * points: Used in shape 'polygon', is the array of points that forms the polygon to be painted, see below


#### Coordinates system

Coordinates system used is same as in canvas, this means that x axis (horizontal) zero is at left and grows to right, and y axis (vertical) zero is at top and grows to bottom.
Rotation angles are reversed according to the coordinates system, that means that a positive angle y counter clock wise.


#### Coordinate values

A coordinate must be specified as:
 
 * A literal value numeric or string (supports floating point), that means an absolute value
 * A string starting with "@" and followed by a number (supports negative and floating point), that means a relative coordinate to the last point painted or the one refered by "ref"

Valid examples are:
```javascript
  10        /* absolute value 10 */
```
```javascript
  1.3       /* absolute value 1.3 */
```
```javascript
  "@5"      /* relative value equal to reference + 5 */
```
```javascript
  "@-8.5"   /* relative value equal to reference - 8.5 */
```

#### Point

A point requires two coordinates (x and y axis) and may be specified at different ways as follows:

 * An array of two elements: [ xref, yref ]
 * An object
 * A string refering the name of a previous point
 * "close" that means the first point in the polygon

Some coordinates may be relative to a reference, the default reference is the last point painted.

A point specified as an object supports these properties:

 * name: is the name that allows other points to refer it
 * x: specifies the x coordinate
 * y: specifies the y coordinate
 * dx: specifies the x coordinate incrementally from the reference point
 * dy: specifies the y coordinate incrementally from the reference point
 * ref: specifies the reference point used instead of the last point painted

Valid examples are:
```javascript
  [ 
    { name: "point1", x: 10, y: 10 },
    { dx: 10, dy: 0 },
    [ "20", "20" ],
    [ "@-10", "@0" ],
    { ref: "point1", dx: -5, dy: 5 },
    "close"
  ]
```


## Dependencies

- [type-tool](https://github.com/lisandropodesta/type-tool)
- [canvas-tool](https://github.com/lisandropodesta/canvas-tool)


## License

polygons is available under the [MIT license] (http://opensource.org/licenses/MIT).
