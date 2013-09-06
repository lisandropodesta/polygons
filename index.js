//
// Export
//
module.exports = CvPoly;

//
// Main class function
//
function CvPoly( e )
{
	var
		cv;

	if ( !( this instanceof CvPoly ) )
	{
		return new CvPoly( e );
	}

	// Get canvas element
	cv = ( e && typeof e === "string" ?
		cv = document.getElementById( e ) :
		e );

	// Get canvas context
	this.ctx = ( cv && cv.getContext && cv.getContext( "2d" ) );
	if ( !this.ctx )
	{
		throw new TypeError( 'CvPoly() requires an element' );
	}
}

var CanvasAttr =
{
	fillStyle: "fillStyle",
	strokeStyle: "strokeStyle",
	lineWidth: "lineWidth"
};

//
// Paint
//
CvPoly.prototype.paint = function ( data )
{
	var
		ctx = this.ctx;

	function isArray( o )
	{
		return Object.prototype.toString.call( o ) === "[object Array]";
	}

	function indexOf( arr, e )
	{
		for ( var i = 0; i < arr.length; i++ )
		{
			if ( i in arr && arr[ i ] === e )
			{
				return i;
			}
			return -1;
		}
	}

	function contains( arr, e )
	{
		return indexOf( arr, e ) >= 0;
	}

	//
	// Calculates a point coordinate based on reference, context and last point 
	//
	function getCoord( ref, name, context, lastpt )
	{
		var
			r, v;

		function chk_lastpt()
		{
			if ( !lastpt )
			{
				throw new Error( "Bad coordinate reference to last point" );
			}
		}

		if ( typeof ref === "number" )
		{
			return ref;
		}
		else if ( typeof ref === "string" )
		{
			v = 0;
			if ( ref[ 0 ] == "@" )
			{
				chk_lastpt();
				v = lastpt[ name ];
				ref = ref.slice( 1 );
			}

			r = parseFloat( ref );
			if ( !isNaN( v ) )
			{
				return v + r;
			}
		}
		else if ( typeof ref === "function" )
		{
			// TO-DO
		}
		else if ( typeof ref === "object" )
		{
			if ( name in ref )
			{
				return getCoord( ref[ name ], name, context, lastpt );
			}

			if ( ( "d" + name ) in ref )
			{
				chk_lastpt();
				return lastpt[ name ] + getCoord( ref[ "d" + name ], name, context, lastpt );
			}
		}

		throw new Error( "Bad coordinate: " + ref );
	}

	function getPoint( ref, context, pt_arr )
	{
		var
			lastpt, res = {};

		if ( typeof ref === "string" )
		{
			if ( ref == "close" )
			{
				return pt_arr[ 0 ];
			}

			// TO-DO: seek stored points of name <ref> in context
		}
		else if ( typeof ref === "function" )
		{
			// TO-DO: evaluate calculated coordinates as functions
		}
		else
		{
			lastpt = pt_arr.length ? pt_arr[ pt_arr.length - 1 ] : null;

			if ( isArray( ref ) )
			{
				if ( ref.length >= 2 )
				{
					return { x: getCoord( ref[ 0 ], 'x', context, lastpt ), y: getCoord( ref[ 1 ], 'y', context, lastpt ) };
				}
			}
			else if ( typeof ref === "object" )
			{
				return { x: getCoord( ref, 'x', context, lastpt ), y: getCoord( ref, 'y', context, lastpt ) };
			}
		}

		throw new Error( "Bad point: " + ref );
	}

	function transformPoint( pt, attr )
	{
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
		if ( sx != 1 )
		{
			x = rx + ( x - rx ) * sx;
		}
		if ( sy != 1 )
		{
			y = ry + ( y - ry ) * sy;
		}

		// Rotation
		if ( rot )
		{
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

	function paint( attr )
	{
		var
			i, n, v, pt,
			pt_arr = [];

		if ( attr.points && attr.points.length >= 0 )
		{
			// Resolve points coordinates
			for ( i = 0; i < attr.points.length; i++ )
			{
				pt_arr[ i ] = getPoint( attr.points[ i ], attr, pt_arr );
			}

			// Assign context attributes
			for ( n in attr )
			{
				v = attr[ n ];
				if ( CanvasAttr[ n ] && !isArray( v ) && typeof v !== "object" )
				{
					ctx[ CanvasAttr[ n ] ] = v;
				}
			}

			// Paint points
			ctx.beginPath();
			for ( i = 0; i < pt_arr.length; i++ )
			{
				pt = transformPoint( pt_arr[ i ], attr );
				ctx[ !i ? "moveTo" : "lineTo" ]( pt.x, pt.y );
			}

			if ( attr.fillStyle )
			{
				ctx.fill();
			}

			ctx.stroke();
		}

		// Avoid repaint on childs
		delete attr.points;
	}

	function evaluate( data, attr )
	{
		var
			i, n, v, attr_copy;

		if ( isArray( data ) )
		{
			for ( i = 0; i < data.length; i++ )
			{
				attr_copy = {};
				for ( n in attr )
				{
					attr_copy[ n ] = attr[ n ];
				}

				evaluate( data[ i ], attr_copy );
			}
		}
		else if ( typeof data === "object" )
		{
			// Store attr asignments
			for ( n in data )
			{
				v = data[ n ];
				attr[ n ] = v;
			}

			// Paint main object
			paint( attr );

			// Evaluate child objects
			for ( n in data )
			{
				v = data[ n ];
				evaluate( v, attr );
			}
		}
	}

	if ( data )
	{
		evaluate( data, {} );
	}
}
