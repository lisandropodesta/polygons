/**
 * Dependencies
 */

var canvasTool = require( 'lisandropodesta-canvas-tool' );
var type = require( 'lisandropodesta-type-tool' );

/**
 * External references
 */

var typeGet = type.get;
var isString = type.isString;
var getAttr = canvasTool.getAttr;
var getContext = canvasTool.getContext;
var getPrimitives = canvasTool.getPrimitives;

/**
 * Exports
 */

module.exports.paint = polygonsPaint;
module.exports.getPrimitives = polygonsGetPrimitives;

/**
 * Polygon painting attributes
 */

var POLYGON_ATTR = {
  scale: true,          // Scale for all axis
  scaleX: true,         // Scale for x axis
  scaleY: true,         // Scale for y axis
  offsetX: true,        // Shift for x axis
  offsetY: true,        // Shift for y axis
  rotation: true,       // Rotation angle in radians
  rotationDeg: true,    // Rotation angle in degrees
  refPointX: true,      // Reference point for transformations x axis coordinate
  refPointY: true,      // Reference point for transformations y axis coordinate

  refPoints: false,     // Reference points to be used by polygons
  polygon: false,       // Array of points to be painted
  childs: false         // Contains child objects to be painted
};

/**
 * Angles conversion factor
 */

var DEG_TO_RAD = Math.PI / 180;

/**
 * Gets an angle value from object property
 *
 * @param {object} object Object containing angle property
 * @param {string} prop Property name
 * @param {number} def Default value
 * @return {number} Angle expressed in radians
 * @api private
 */

function getAngle( object, prop, def ) {
  return prop in object ? object[ prop ] :
    ( prop + 'Deg' ) in object ? DEG_TO_RAD * object[ prop + 'Deg' ] : ( def || 0 );
}

/**
 * Paints all polygons specified at data
 *
 * @param {object} data Data containing structure to paint
 * @param {element|string} target Target canvas element or target canvas element ID
 * @return {Polygons} Polygons object
 * @api public
 */

function polygonsPaint( data, target ) {

  ( new Polygons() ).paint( data, target ) ;
}

/**
 * Get painting primitives
 *
 * @param {object} data Data containing structure to paint
 * @return {CanvasPrimitives} Representation of all primitives required to paint data
 * @api public
 */

function polygonsGetPrimitives( data ) {

  var pri = getPrimitives();

  ( new Polygons() ).paint( data, pri );

  return pri;
}

/**
 * Polygons constructor
 *
 * @return {Polygons} Polygons object
 * @api public
 */

function Polygons() {
  this.figures = [];
}

/**
 * Evaluates data structure and paints polygons
 *
 * @param {object} data Data containing structure to paint
 * @param {element|string} target Target canvas element or target canvas element ID
 * @api public
 */

Polygons.prototype.paint = function( data, target ) {

  if ( target === undefined ) {
    target = data;
    data = this.figures;
  }

  if ( data ) {

    // Assign context
    this.context = getContext( target );
    if ( !this.context ) {
      throw new TypeError( 'Polygons.paint() requires a canvas' );
    }

    // Initialize reference points
    this.refPoints = {};

    // Evaluates data
    this.evaluate( data, {} );
  }
}

/**
 * Evaluates data structure and paints polygons
 *
 * @param {object} data Data containing structure to paint
 * @param {object} attr Painting attributes
 * @api private
*/

Polygons.prototype.evaluate = function( data, attr ) {

  var i, n, t, attr_copy;

  t = typeGet( data );
  if ( t.isArray ) {
    // Evaluates each element in a separate attributes context
    for ( i = 0; i < data.length; i++ ) {
      attr_copy = {};
      for ( n in attr ) {
        if ( false !== POLYGON_ATTR[ n ] ) {
          attr_copy[ n ] = attr[ n ];
        }
      }

      this.evaluate( data[ i ], attr_copy );
    }
  }
  else if ( t.isObject ) {

    // Stores attr asignments
    for ( n in data ) {
      attr[ n ] = data[ n ];
    }

    // Paints main object
    this.paintPolygon( attr );

    // Evaluates child objects
    if ( data.childs ) {
      this.evaluate( data.childs, attr );
    }
  }
}

/**
 * Paints a single shape
 *
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.paintPolygon = function( attr ) {

  var i, n, v, t, pt, points;
  var pt_arr = [];
  var ctx = this.context;

  // Resolve reference points coordinates
  if ( attr.refPoints ) {
    this.resolvePoints( attr.refPoints, attr );
  }

  // Assign attributes
  for ( n in attr ) {
    v = attr[ n ];
    t = typeGet( v );
    if ( getAttr( n ) && !t.isArray && !t.isObject ) {
      ctx[ getAttr( n ) ] = v;
    }
  }

  ctx.beginPath();

  points = attr.points || [];
  switch ( attr.shape ) {
    case 'rect':
      if ( !attr.position || !attr.position.length || !attr.width || !attr.height ) {
        break;
      }

      pt_arr = this.resolvePoints( [ attr.position ], attr );
      var x = pt_arr[ 0 ].x;
      var y = pt_arr[ 0 ].y;
      points = [
        [ x, y ],
        [ x + attr.width, y ],
        [ x + attr.width, y + attr.height ],
        [ x, y + attr.height ],
        [ x, y ]
      ];
      // no break

    case 'polygon':
      if ( 0 <= points.length ) {
        pt_arr = this.resolvePoints( points, attr );
        for ( i = 0; i < pt_arr.length; i++ ) {
          pt = this.transformPoint( pt_arr[ i ], attr );
          ctx[ !i ? 'moveTo' : 'lineTo' ]( pt.x, pt.y );
        }
      }
      break;

    case 'circle':
      if ( !attr.position || !attr.radius ) {
        break;
      }
      attr.startAngle = 0;
      attr.endAngle = 2 * Math.PI;
      // no break

    case 'arc':
      pt_arr = this.resolvePoints( [ attr.position ], attr );
      ctx.arc( pt_arr[ 0 ].x, pt_arr[ 0 ].y, attr.radius,
          -getAngle( attr, 'startAngle' ), -getAngle( attr, 'endAngle' ), true );
      break;
  }

  if ( attr.fillStyle ) {
    ctx.fill();
  }

  ctx.stroke();
}

/**
 * Resolve points coordinates
 *
 * @param {array} arr Array of points to resolve
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.resolvePoints = function( arr, attr ) {

  var res = [];

  for ( var i = 0; i < arr.length; i++ ) {
    var pt = arr[ i ];
    res[ i ] = this.getPoint( pt, attr, res );
    if ( isString( pt.name ) && pt.name.length ) {
      this.refPoints[ pt.name ] = res[ i ];
    }
  }

  return res;
}

/**
 * Calculates a point coordinates
 *
 * @param {object} ref Reference data to decode
 * @param {object} attr Painting attributes
 * @param {object array} pt_arr Array of points already resolved
 * @api private
 */

Polygons.prototype.getPoint = function( ref, attr, pt_arr ) {

  var res = {};

  var t = typeGet( ref );
  if ( t.isString ) {
    if ( pt_arr && 'close' == ref ) {
      return pt_arr[ 0 ];
    }

    // Seek stored points of name <ref>
    if ( this.refPoints[ ref ] ) {
      return this.refPoints[ ref ];
    }
  }
  else if ( t.isFunction ) {
    // TO-DO: evaluate calculated coordinates as functions
  }
  else {
    var lastpt = pt_arr && pt_arr.length ? pt_arr[ pt_arr.length - 1 ] : null;

    if ( t.isArray ) {
      if ( 2 <= ref.length ) {
        return { x: this.getCoord( ref[ 0 ], 'x', attr, lastpt ), y: this.getCoord( ref[ 1 ], 'y', attr, lastpt ) };
      }
    }
    else if ( t.isObject ) {
      return { x: this.getCoord( ref, 'x', attr, lastpt ), y: this.getCoord( ref, 'y', attr, lastpt ) };
    }
  }

  throw new Error( 'Bad point: ' + ref );
}

/**
 * Verifies a point is not null
 *
 * @param {object} point Point to verify
 * @api private
 */
function assertPoint( point ) {
  if ( !point ) {
    throw new Error( 'No reference point' );
  }
}

/**
 * Calculates a point coordinate based on reference, attr and last point 
 *
 * @param {object} ref Reference data to decode
 * @param {string} name Coordinate name beeing processed
 * @param {object} attr Painting attributes
 * @param {object} lastpt Last point, used as reference
 * @api private
 */

Polygons.prototype.getCoord = function( ref, name, attr, lastpt ) {

  var t = typeGet( ref );
  if ( t.isNumber ) {
    return ref;
  }
  else if ( t.isString ) {
    var v = 0;
    if ( '@' == ref[ 0 ] ) {
      assertPoint( lastpt );
      v = lastpt[ name ];
      ref = ref.slice( 1 );
    }

    var r = parseFloat( ref );
    if ( !isNaN( v ) ) {
      return v + r;
    }
  }
  else if ( t.isFunction ) {
    // TO-DO
  }
  else if ( t.isObject ) {
    if ( name in ref ) {
      return this.getCoord( ref[ name ], name, attr, lastpt );
    }

    if ( ( 'd' + name ) in ref ) {
      var refpt = ( 'ref' in ref ? this.getPoint( ref[ 'ref' ], attr, null ) : lastpt );
      assertPoint( refpt );
      return refpt[ name ] + this.getCoord( ref[ 'd' + name ], name, attr, refpt );
    }
  }

  throw new Error( 'Bad coordinate: ' + ref );
}

/**
 * Transform point coordinates in an attribute context
 *
 * @param {object} pt Point to be transformed
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.transformPoint = function( pt, attr ) {

  var x, y, sx, sy, rx, ry, rot, h, a;

  x = pt.x;
  y = pt.y;

  sx = attr.scaleX || attr.scale || 1;
  sy = attr.scaleY || attr.scale || 1;
  rx = attr.refPointX || 0;
  ry = attr.refPointY || 0;
  rot = getAngle( attr, 'rotation' );

  // TO-DO: Support nested transformations

  // Scaling
  if ( sx != 1 ) {
    x = rx + ( x - rx ) * sx;
  }
  if ( sy != 1 ) {
    y = ry + ( y - ry ) * sy;
  }

  // Rotation
  if ( rot ) {
    x -= rx;
    y -= ry;
    h = Math.sqrt( x * x + y * y );
    a = Math.atan2( y, x ) - rot;
    x = rx + h * Math.cos( a );
    y = ry + h * Math.sin( a );
  }

  // Offset
  x += ( attr.offsetX || 0 );
  y += ( attr.offsetY || 0 );

  return { x: x, y: y };
}

