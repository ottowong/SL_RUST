const shopGreen = "#aaef35"

const mainRed = "#ae3534"
const secondRed = "#371210"

var all_markers;

window.onload = function () {
    var map = L.map('map-canvas',{ 
        crs: L.CRS.Simple, // use px coords
        zoom: -2,
        minZoom: -2,
        maxZoom: 5
    }).setView([1000, 1000], -2);

    const shopIcon = L.divIcon({
        html: `<svg width="26" height="26">
        <circle cx="13" cy="13" r="13" fill="black" />
        <circle cx="13" cy="13" r="11"  fill="#aaef35" />
        <text x="13" y="15" class="fas" font-size="13" fill="black">
        &#xf07a;
        </text></svg>`,
        className: "",
        iconSize: [26, 26],
        iconAnchor: [0, 0],
    });

    var imageUrl = '../static/map.png';
    let width = 2000
    let height = 2000
    let boundPadding = 1000

    var imageSize = [height, width];
    var imageBounds = [[0, 0], imageSize];

    L.imageOverlay(imageUrl, imageBounds).addTo(map);

    var maxBounds = L.latLngBounds([
        [0 - boundPadding, 0 - boundPadding], 
        [height + boundPadding, width + boundPadding]
    ]);
    map.setMaxBounds(maxBounds);

    function updateMarkers() {
        console.log("updateMarkers")
        // Remove existing markers
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add markers from the coordinates array
        all_markers.forEach(function(marker) {
            var y = marker[1] / 4500 * 2000
            var x = marker[2] / 4500 * 2000
            var rot = marker[3] // double check the rotation is correct
            var icon;
            switch (marker[0]) {
                case 1: // player
                    console.log(marker[4])
                    
                    icon = createPlayerIcon(marker[4].is_alive, marker[4].is_online, marker[4].steam_id, marker[4].name, marker[4].profile_url)
                    L.rotatedMarker([x,y], {icon: icon, rotationAngle: rot}).on('click', onClick).addTo(map).on('click', function(e) { window.open(marker[4].profile_url) });
                    break;
                case 2: // explosion
                    // currently removed
                    break;
                case 3: // shop
                    icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a", "black")
                    break;
                case 4: // CH47
                    icon = createCustomIcon(shopGreen,shopGreen,"f07a", "black")
                    break;
                case 5: // cargo ship
                    icon = createCustomIcon(shopGreen,shopGreen,"f07a", "black")
                    break;
                case 6: // crate
                    // currently removed
                    break;
                case 7: // generic radius (whats that???)
                    break;
                case 8: // patrol helicopter
                console.log(rot)
                    icon = createCustomIcon(shopGreen,shopGreen,"<", "black")
                    break;
                default:
                    icon = createCustomIcon(shopGreen,shopGreen,"f07a", "black")
            }


            // L.rotatedMarker([x,y], {icon: icon, rotationAngle: rot}).on('click', onClick).addTo(map);
        });
    }

    function createPlayerIcon(isalive, isonline, steamid, name, url){ // show name on hover and open url on click
        let onlineColour;
        let dead = ""
        if(isonline){
            onlineColour= "green"
        } else {
            onlineColour= "gray"
        }
        if(!isalive){
            dead = `<circle cx="13" cy="13" r="11" fill="red" fill-opacity="0.3"/>`
        }
        return L.divIcon({
            html: `
            <svg width="26" height="26">
                <defs>
                    <clipPath id="circleClip">
                        <circle cx="13" cy="13" r="11" />
                    </clipPath>
                </defs>
                <circle cx="13" cy="13" r="14" fill="${onlineColour}"/>
                <image href="../static/profilepics/${steamid}.jpg" x="2" y="2" width="22" height="22" clip-path="url(#circleClip)" />
                ${dead}
            </svg>`,
            className: "",
            iconSize: [26, 26],
            iconAnchor: [0, 0],
        });
    }

    function createCustomIcon(primary_colour, secondary_colour, icon, text_colour=primary_colour) {
        if(primary_colour == secondary_colour){
            fontSize = 13
        } else {
            fontSize = 11
        }
        return L.divIcon({
            html: `
            <svg width="26" height="26">
                <circle cx="13" cy="13" r="13" fill="black" />
                <circle cx="13" cy="13" r="11"  fill="${primary_colour}" />
                <circle cx="13" cy="13" r="9"  fill="${secondary_colour}" />
                <text x="13" y="15" class="fas" font-size="${fontSize}" fill="${text_colour}">
                ${icon};
                </text>
            </svg>`,
            className: "",
            iconSize: [26, 26],
            iconAnchor: [0, 0],
        });
    }

    function onClick(e) {
        console.log(this.getLatLng());
    }

    setInterval(updateMarkers, 1000);
};