
let coordinateDict = {};

function cacheCenters(centers, viewport) {
	let dict = R.groupBy(c => generateKey(c.address.lat, c.address.lng))(centers);
	let keys = getViewportCacheKeys(viewport);

	keys.forEach(key => {
		coordinateDict[key] = dict[key] || null;
	});
	console.log(`cacheCenters completed ${Object.keys(dict).length}`);
}

function checkCache(viewport) {
	let keys = getViewportCacheKeys(viewport);
	let hasKeys = checkCacheForKeys(coordinateDict, keys);
	if (!hasKeys) return null;
	// get all centers in viewport
	let allKeyValues = getKeysFromCache(coordinateDict, keys);
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
	let distanceInMeters = distanceBetweenTwoCoordinates(center.lat, center.lng, value.address.lat, value.address.lng);
	// Convert from meters to miles
	let miles = distanceInMeters * 0.000621371;
	let milesRounded = Math.floor(miles * 10);
	return milesRounded;
}

function checkCacheForKeys(cache, keys) {
	return R.all(key => key in cache)(keys);
}

function getKeysFromCache(cache, keys) {
	return keys.map(key => cache[key]);
}

function getViewportCacheKeys(viewport) {
	let vp = roundViewport(viewport);

	let latArr = generateKeyArray(vp.lat1, vp.lat0);
	let lngArr = generateKeyArray(vp.lng1, vp.lng0);

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
	let arr = [];
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
