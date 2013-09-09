//
// Dependencies
//
var canvasTool = require( 'canvas-tool' );
var type = require( 'type-tool' );

//
// Exports
//
module.exports.paint = paint;
module.exports.getPrimitives = getPrimitives;

//
// Paints all polygons specified at data
//
function paint( data, target ) {

  ( new Polygons() ).paint( data, target ) ;
}

//
// Get painting primitives
//
function getPrimitives ( data ) {
  var
    pri = canvasTool.getPrimitives();

  ( new Polygons() ).paint( data, pri );

  return pri;
}

//
// Polygons constructor
//
function Polygons( target ) {
}

//
// Evaluates data structure and paints polygons
//
Polygons.prototype.paint = function ( data, target ) {

  if ( data ) {

    // Assign context
    this.context = canvasTool.getContext( target );
    if ( !this.context ) {
      throw new TypeError( "Polygons.paint() requires a canvas" );
    }

    // Initialize reference points
    this.refPoints = {};

    // Evaluates data
    this.evaluate( data, {} );
  }
}

//
// Evaluates data structure and paints polygons
//
Polygons.prototype.evaluate = function ( data, attr ) {
  var
    i, n, v, t, attr_copy;

  t = type.get( data );
  if ( t.isArray ) {
    // Evaluates each element in a separate attributes context
    for ( i = 0; i < data.length; i++ ) {
      attr_copy = {};
      for ( n in attr ) {
        attr_copy[ n ] = attr[ n ];
      }

      this.evaluate( data[ i ], attr_copy );
    }
  }
  else if ( t.isObject ) {
    // Stores attr asignments
    for ( n in data ) {
      v = data[ n ];
      attr[ n ] = v;
    }

    // Paints main object
    this.paintPolygon( attr );

    // Evaluates child objects
    for ( n in data ) {
      if ( "polygon" != n && "points" != n ) {
        v = data[ n ];
        this.evaluate( v, attr );
      }
    }
  }
}

//
// Paints a single polygon
//
Polygons.prototype.paintPolygon = function ( attr ) {
  var
    i, n, v, t, pt, ctx,
    pt_arr = [];

  ctx = this.context;

  // Resolve reference points coordinates
  if ( attr.refPoints ) {
    for ( i = 0; i < attr.refPoints.length; i++ ) {
      pt = attr.refPoints[ i ];
      if ( pt.name && type.isString( pt.name ) ) {
        this.refPoints[ pt.name ] = this.getPoint( pt, attr, null );
      }
    }
  }

  if ( attr.polygon && attr.polygon.length >= 0 ) {
    // Resolve polygon coordinates
    for ( i = 0; i < attr.polygon.length; i++ ) {
      pt_arr[ i ] = this.getPoint( attr.polygon[ i ], attr, pt_arr );
    }

    // Assign attributes
    for ( n in attr ) {
      v = attr[ n ];
      t = type.get( v );
      if ( canvasTool.getAttr( n ) && !t.isArray && !t.isObject ) {
        ctx[ canvasTool.getAttr( n ) ] = v;
      }
    }

    // Paints polygon
    ctx.beginPath();
    for ( i = 0; i < pt_arr.length; i++ ) {
      pt = this.transformPoint( pt_arr[ i ], attr );
      ctx[ !i ? "moveTo" : "lineTo" ]( pt.x, pt.y );
    }

    if ( attr.fillStyle ) {
      ctx.fill();
    }

    ctx.stroke();
  }
}

//
// Calculates a point coordinates
//
Polygons.prototype.getPoint = function ( ref, attr, pt_arr ) {
  var
    t, lastpt,
    res = {};

  t = type.get( ref );
  if ( t.isString ) {
    if ( pt_arr && ref == "close" ) {
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
    lastpt = pt_arr && pt_arr.length ? pt_arr[ pt_arr.length - 1 ] : null;

    if ( t.isArray ) {
      if ( ref.length >= 2 ) {
        return { x: this.getCoord( ref[ 0 ], "x", attr, lastpt ), y: this.getCoord( ref[ 1 ], "y", attr, lastpt ) };
      }
    }
    else if ( t.isObject ) {
      return { x: this.getCoord( ref, "x", attr, lastpt ), y: this.getCoord( ref, "y", attr, lastpt ) };
    }
  }

  throw new Error( "Bad point: " + ref );
}

//
// Calculates a point coordinate based on reference, attr and last point 
//
Polygons.prototype.getCoord = function ( ref, name, attr, lastpt ) {
  var
    t, r, v, refpt;

  function chk_lastpt() {
    if ( !lastpt ) {
      throw new Error( "Bad coordinate reference to last point" );
    }
  }

  t = type.get( ref );
  if ( t.isNumber ) {
    return ref;
  }
  else if ( t.isString ) {
    v = 0;
    if ( "@" == ref[ 0 ] ) {
      chk_lastpt();
      v = lastpt[ name ];
      ref = ref.slice( 1 );
    }

    r = parseFloat( ref );
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

    if ( ( "d" + name ) in ref ) {
      if ( "ref" in ref ) {
        refpt = this.getPoint( ref[ "ref" ], attr, null );
      }
      else {
        chk_lastpt();
        refpt = lastpt;
      }

      return refpt[ name ] + this.getCoord( ref[ "d" + name ], name, attr, refpt );
    }
  }

  throw new Error( "Bad coordinate: " + ref );
}

//
// Transform point coordinates in an attribute context
//
Polygons.prototype.transformPoint = function ( pt, attr ) {
  var
    x, y, sx, sy, rx, ry, rot, h, a;

  x = pt.x;
  y = pt.y;

  sx = attr[ "@scaleX" ] || attr[ "@scale" ] || 1;
  sy = attr[ "@scaleY" ] || attr[ "@scale" ] || 1;
  rx = attr[ "@refpointX" ] || 0;
  ry = attr[ "@refpointY" ] || 0;
  rot = attr[ "@rotation" ] || ( ( attr[ "@rotation_deg" ] || 0 ) * Math.PI / 180 );

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
  x += ( attr[ "@offsetX" ] || 0 );
  y += ( attr[ "@offsetY" ] || 0 );

  return { x: x, y: y };
}

