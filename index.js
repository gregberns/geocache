var geocode = (function(config) {
	let coordinateDict = {};

	function store(centers, viewport) {
		var dict = R.groupBy(c => generateKey(c.address.lat, c.address.lng))(centers);
		var keys = getViewportCacheKeys(viewport);

		keys.forEach(key => {
			coordinateDict[key] = dict[key] || null;
		});
		console.log(`cacheCenters completed ${Object.keys(dict).length}`);
	}

	function retrieve(viewport) {
		var keys = getViewportCacheKeys(viewport);
		var hasKeys = checkCacheForKeys(coordinateDict, keys);
		if (!hasKeys) return null;
		// get all centers in viewport
		var allKeyValues = getKeysFromCache(coordinateDict, keys);
		return R.flatten(allKeyValues)
				.filter(v => Boolean(v))
				.map(v => {
					v.distance = calculateDistance(viewport.center, v);
					return v;
				})
				.sort(v => v.distance)
				.map(v => {
					v.distance /= 10;
					return v;
				});
	}

	function calculateDistance(center, value) {
		var distanceInMeters = distanceBetweenTwoCoordinates(center.lat, center.lng, value.address.lat, value.address.lng);
		// Convert from meters to miles
		var miles = distanceInMeters * 0.000621371;
		var milesRounded = Math.floor(miles * 10);
		return milesRounded;
	}

	function checkCacheForKeys(cache, keys) {
		return R.all(key => key in cache)(keys);
	}

	function getKeysFromCache(cache, keys) {
		return keys.map(key => cache[key]);
	}

	function getViewportCacheKeys(viewport) {
		var vp = roundViewport(viewport);

		var latArr = generateKeyArray(vp.lat1, vp.lat0);
		var lngArr = generateKeyArray(vp.lng1, vp.lng0);

		var keys = R.xprod(latArr, lngArr).map(sArr => `${sArr[0]}x${sArr[1]}`);

		return keys;
	}

	function roundViewport(viewport) {
		return {
			lat0: Math.floor(viewport.lat0 * 10),
			lng0: Math.floor(viewport.lng0 * 10),
			lat1: Math.ceil(viewport.lat1 * 10),
			lng1: Math.ceil(viewport.lng1 * 10)
		};
	}

	function generateKey(lat, lng) {
		return `${Math.floor(lat * 10)}x${Math.floor(lng * 10)}`;
	}

	function generateKeyArray(lowerCoordinate, higherCoordinate) {
		var arr = [];
		for (var curr = lowerCoordinate; curr < higherCoordinate; ++curr) {
			arr.push(curr);
		}
		return arr;
	}

	function distanceBetweenTwoCoordinates(lat1, lon1, lat2, lon2) {
		// generally used geo measurement function
	    var R = 6378.137; // Radius of earth in KM
	    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
	    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
	    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
	    Math.sin(dLon/2) * Math.sin(dLon/2);
	    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	    var d = R * c;
	    return d * 1000; // meters
	}
	
	return {
		store: store,
		retrieve: retrieve
	};
})(config)
