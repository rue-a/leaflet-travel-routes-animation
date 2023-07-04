// create map and add baseLayer
async function fetchData(file) {
    try {
        const response = await fetch(file);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

function calculateDirection(lat1, lon1, lat2, lon2) {
    // Convert coordinates from degrees to radians
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);


    // Calculate the difference between the longitudes
    const dLon = lon2Rad - lon1Rad;

    // Calculate the direction using the Haversine formula
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    console.log(lat1, lon1, lat2, lon2)
    // Convert the direction from radians to degrees
    let direction = Math.atan2(y, x);
    direction = toDegrees(direction);

    // Normalize the direction between 0 and 360 degrees
    direction = (direction + 360) % 360;

    return direction;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}


function parse_LPF(lpf_json) {
    /** Convert from LPF-JSON into target format.
     * 
     * Assumes that the tracks are stored as a feature collection,
     * where each track is stored as a single feature. The differnet
     * positions that are visited within a track should be given in 
     * a geometry collection, where each geometry has a "when" attribute 
     * that specifies a "start.in" value that is used to idendtify the 
     * instant at which the according position is reached.
     * 
     * target fromat:
     * [
     *      [                                                       \
     *          {                                   \                |
     *              "lng": <float>,                  |               |
     *              "lat": <float>,                  |  position     |
     *              "time": <int(UNIX timestamp)>,    >     in a      > a track
     *              "dir": <float>,                  |     track     |
     *              "heading": <float>,              |               |
     *              "info": []                       |               |
     *          },                                  /                |
     *          { ... },                            -> another pos.  |
     *      ],                                                      /
     *      [ ... ]                                                 -> another track
     * ]
     * 
     * // ignoring heading currently
     */

    const tracks = []
    lpf_json.features.forEach(feature => {
        const track = feature.geometry.geometries.map(geometry => {
            return {
                lng: geometry.coordinates[0],
                lat: geometry.coordinates[1],
                time: Math.floor(Date.parse(geometry.when.timespans.start.in) / 1000),
                info: [feature.properties.title]
            };
        });
        let dir = 0
        track.forEach((position, i) => {
            if (i == track.length - 1) position.dir = track[i - 1].dir
            else {
                dir += calculateDirection(position.lat, position.lng, track[i + 1].lat, track[i + 1].lng)
                if (dir >= 360) dir -= 360
                position.dir = dir
            }
        })
        tracks.push(track)

    })
    console.log(tracks)

    return tracks
}

const map = L.map("mapid").setView(
    [40.78897, -80.55885],
    5
);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// get data from server
fetchData('data/fliegel_tracks_lpf/tracks.json').then(data => {
    data = parse_LPF(data);
    const trackplayback = L.trackplayback(data, map, {
        clockOptions: { speed: 25 },
        targetOptions: {
            useImg: true,
            imgUrl: "ship.png",
        },
    });
    const trackplaybackControl = L.trackplaybackcontrol(trackplayback);
    trackplaybackControl.addTo(map);
})


