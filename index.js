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
var isArray = type.isArray;
var isObject = type.isObject;
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
  scale: {              // Scale
    from: 1,
    to: 1,
    put: function ( attr, val ) {
      if ( 'shift' in attr ) {
        attr.shift.x *= val;
        attr.shift.y *= val;
      }
      attr.scale = attrGet( attr, 'scale', 1 ) * val;
    }
  },
  alpha: {
    from: 1,
    to: 1
  },
  shift: {              // Shift
    array: 2,
    from: [ 0, 0 ],
    to: [ 0, 0 ],
    put: function ( attr, val ) {
      if ( isArray( val ) ) {
        if ( !( 'shift' in attr ) ) {
          attr.shift = { x: 0, y: 0 };
        }
        attr.shift.x += val[ 0 ];
        attr.shift.y += val[ 1 ];
      }
    }
  },
  rotation: {           // Rotation angle in radians
    from: 0,
    to: 0,
    put: function ( attr, val ) {
      attr.rotation = -attrAngle( attr, 'rotation', 0 ) + val;
      attr.rotationDeg = attr.rotation * RAD_TO_DEG;
    }
  },
  rotationDeg: {        // Rotation angle in degrees
    from: 0,
    to: 0,
    put: function ( attr, val ) {
      attr.rotation = -attrAngle( attr, 'rotation', 0 ) + val * DEG_TO_RAD;
      attr.rotationDeg = attr.rotation * RAD_TO_DEG;
    }
  },

  refPointX: true,      // Reference point for transformations x axis coordinate
  refPointY: true,      // Reference point for transformations y axis coordinate

  refPoints: false,     // Reference points to be used by polygons
  polygon: false,       // Array of points to be painted
  childs: false         // Contains child objects to be painted
};

/**
 * Angles conversion factor
 */

var DEG_TO_RAD = Math.PI / 180,
  RAD_TO_DEG = 180 / Math.PI;

/**
 * Gets a value from attributes object
 *
 * @param {object} attr Attributes object
 * @param {string} prop Property name
 * @param {number} def Default value
 * @return {number} Obtained value
 * @api private
 */

function attrGet( attr, prop, def ) {
  return ( prop in attr ? attr[ prop ] : def );
}

/**
 * Applies a value into an attributes object
 *
 * @param {object} attr Attributes object
 * @param {string} prop Property name
 * @param {number} val Value to be assigned
 * @api private
 */

function attrPut( attr, prop, val ) {
  if ( ( prop in POLYGON_ATTR ) && POLYGON_ATTR[ prop ].put ) {
    POLYGON_ATTR[ prop ].put( attr, val );
  } else {
    attr[ prop ] = val;
  }
}

/**
 * Gets an angle value from attributes object
 *
 * @param {object} attr Attributes object
 * @param {string} prop Property name
 * @param {number} def Default value
 * @return {number} Angle expressed in radians
 * @api private
 */

function attrAngle( attr, prop, def ) {
  return - ( prop in attr ? attr[ prop ] :
    ( prop + 'Deg' ) in attr ? DEG_TO_RAD * attr[ prop + 'Deg' ] : ( def || 0 ) );
}

/**
 * Gets a scale value from attributes object
 *
 * @param {object} attr Attributes object
 * @api private
 */

function attrScale( attr ) {
  return attrGet( attr, 'scale', 1 );
}

/**
 * Paints all polygons specified at data
 *
 * @param {object} data Data containing structure to paint
 * @param {element|string} target Target canvas element or target canvas element ID
 * @return {Polygons} Polygons object
 * @api public
 */

function polygonsPaint( data, target, animation ) {

  ( new Polygons() ).paint( data, target, animation ) ;
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
 * Request Animation Frame
 *
 * @param {function} cbk Callback that paints the frame
 * @api public
 */

function requestAnimationFrame( cbk ) {
  return ( window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( cbk ) {
      window.setTimeout( cbk, 1000 / 30 );
    } )( cbk );
};

/**
 * Get a value matching requeriment
 *
 * @param {object} src Data to be processed
 * @param {string} prop Property name
 * @param {string} name Attribute name
 * @api public
 */

function matchValue( src, prop, name ) {
  if ( name in src ) {
    var a1 = !isArray( src[ name ] ) ? -1 : src[ name ].length,
      a2 = POLYGON_ATTR[ prop ].array || -1;
    if ( a1 == a2 ) {
      return src[ name ];
    }
  }

  return POLYGON_ATTR[ prop ][ name ];
}

/**
 * Get a value associated to an animation step
 *
 * @param {ordinal|object} src Data to be processed
 * @param {string} n Property name
 * @api public
 */

function animateValue( src, n, per ) {
  var a = { finished: true };

  if ( isObject( src ) ) {
    var cnt = POLYGON_ATTR[ n ].array,
      from = matchValue( src, n, 'from' ),
      to = matchValue( src, n, 'to' );

    if ( per >= 1 ) {
      a.value = to;
    } else {
      if ( cnt ) {
        a.value = [];
        for ( var i = 0; i < cnt; i++ ) {
          a.value[ i ] = from[ i ] * ( 1 - per ) + to[ i ] * per;
        }
      } else {
        a.value = from * ( 1 - per ) + to * per;
      }
      a.finished = false;
    }
  } else {
    a.value = src;
  }

  return a;
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

Polygons.prototype.paint = function( data, target, animation ) {

  if ( target === undefined ) {
    target = data;
    data = this.figures;
  }

  if ( data ) {

    if ( isString( target ) ) {
      var e = document.getElementById( target );
      if ( e ) {
        this.width = e.width;
        this.height = e.height;
      }
    }

    // Assign context
    this.context = getContext( target );
    if ( !this.context ) {
      throw new TypeError( 'Polygons.paint() requires a canvas' );
    }

    var that = this,
      start = ( new Date() ).getTime(),
      duration = ( animation && animation.duration > 0 ? animation.duration * 1000 : 0 );

    function paintFrame() {

      var attr = {};

      // Initialize reference points
      that.refPoints = {};
      that.context.clearRect( 0, 0, that.width, that.height );

      var per = 1;
      if ( duration ) {
        var per = ( ( new Date() ).getTime() - start ) / duration;
      }

      var finished = true;
      for ( var n in POLYGON_ATTR ) {
        if ( ( n in animation ) ) {
          var a = animateValue( animation[ n ], n, per );
          attrPut( attr, n, a.value );
          finished = finished && a.finished;
        }
      }

      if ( 'alpha' in attr ) {
        that.context.globalAlpha = attr [ 'alpha' ];
      }

      // Evaluates data
      that.evaluate( data, attr );

      if ( !finished ) {
        requestAnimationFrame( paintFrame );
      }
    }

    if ( duration ) {
      requestAnimationFrame( paintFrame );
    } else {
      paintFrame();
    }
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
      attrPut( attr, n, data[ n ] );
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
        pt_arr = this.transformPoints( this.resolvePoints( points, attr ), attr );
        ctx.moveTo( pt_arr[ 0 ].x, pt_arr[ 0 ].y );
        for ( i = 1; i < pt_arr.length; i++ ) {
          pt = pt_arr[ i ];
          ctx.lineTo( pt.x, pt.y );
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
      pt_arr = this.transformPoints( this.resolvePoints( [ attr.position ], attr ), attr );
      ctx.arc( pt_arr[ 0 ].x, pt_arr[ 0 ].y, this.transformSize( 'radius', attr ),
          this.transformAngle( 'startAngle', attr ), this.transformAngle( 'endAngle', attr ), true );
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
 * Transform an angle in an attribute context
 *
 * @param {string} name Angle name to be transformed
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.transformAngle = function( name, attr ) {
  return attrAngle( attr, name ) + attrAngle( attr, 'rotation' );
}

/**
 * Transform a dimmention in an attribute context
 *
 * @param {string} name Dimmention name to be transformed
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.transformSize  = function( name, attr ) {
  return attrScale( attr ) * attr[ name ];
}

/**
 * Transform point coordinates in an attribute context
 *
 * @param {array} arr Array of points to resolve
 * @param {object} attr Painting attributes
 * @api private
 */

Polygons.prototype.transformPoints = function( arr, attr ) {
  var res = [];

  for ( var i = 0; i < arr.length; i++ ) {
    res.push( this.transformPoint( arr[ i ], attr ) );
  }

  return res;
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

  sx = sy = attrScale( attr );
  rx = attr.refPointX || 0;
  ry = attr.refPointY || 0;
  rot = attrAngle( attr, 'rotation' );

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
    a = Math.atan2( y, x ) + rot;
    x = rx + h * Math.cos( a );
    y = ry + h * Math.sin( a );
  }

  // Offset
  if ( isObject( attr.shift ) ) {
    x += attr.shift.x;
    y += attr.shift.y;
  }

  return { x: x, y: y };
}

