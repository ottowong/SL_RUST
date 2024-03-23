// set these dynamically if possible, otherwise in .env
const mapHeight = 4500
const mapWidth = 4500

const pixelHeight = 2000
const pixelWidth = 2000

const shopGreen = "#aaef35"

const mainYellow = "#b9bb4c"
const secondYellow = "#454619"

const mainBlue = "#2e6bb8"
const secondBlue = "#12243f"

const mainGreen = "#72a137"
const secondGreen = "#243510"

const mainRed = "#ae3534"
const secondRed = "#371210"

const mainMagenta = "#9b4fa6"
const secondMagenta = "#351a39"

const mainCyan = "#0ae8be"
const secondCyan = "#08493a"

var map_pins = [];
var map;

function updateNotes(newNotes) {
    // TO DO
}

function updateMarkers(socket_markers) {
    // Remove existing pins from the map
    for (var i = map_pins.length - 1; i >= 0; i--) { // iterate backwards because removing stuff breaks it otherwise
        let pin = map_pins[i]
        var index = map_pins.indexOf(pin);
        // these will be removed if they no longer exist.
        if (index !== -1 && [2, 3, 6, 7].includes(pin.options.rust_type)) { // Explosion, Shop, Crate, GenericRadius
            for (var j = socket_markers.length - 1; j >= 0; j--){ // check new data one by one
                let current_marker = socket_markers[j]
                let pinLatLng = pin.getLatLng()
                let temp_x = current_marker[2] / mapWidth * pixelWidth
                let temp_y = current_marker[1] / mapHeight * pixelHeight
                // if an exact match exists in both
                if(pin.options.rust_type == current_marker[0] && temp_y == pinLatLng.lng && temp_x == pinLatLng.lat ){ 
                    socket_markers.splice(j,1) // remove from the NEW list so that it is not re-added
                }
            }
        }
        // Players will be updated if they still exist
        else if (index !== -1 && [1].includes(pin.options.rust_type)) { // Player
            for (var j = socket_markers.length - 1; j >= 0; j--){
                let current_marker = socket_markers[j]
                let temp_x = current_marker[2] / mapWidth * pixelWidth
                let temp_y = current_marker[1] / mapHeight * pixelHeight
                if(pin.options.rust_type == 1 && pin.options.steam_id == current_marker[4].steam_id) { 
                    pin.setLatLng([temp_x, temp_y])
                    socket_markers.splice(j,1)
                }
            }
        // remove everything else
        } else {
            map.removeLayer(pin);
            map_pins.splice(index, 1);
        }
    }

    // create new icons
    for (var k = socket_markers.length - 1; k >= 0; k--){
        let newMarker = socket_markers[k]
        var y = newMarker[1] / mapHeight * pixelHeight
        var x = newMarker[2] / mapWidth * pixelWidth
        var rot = newMarker[3] * -1
        let icon;
        icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a", "black")
        let steamId;
        if(newMarker[0] == 1){
            steamId = newMarker[4].steam_id
        }
        let current_pin = L.rotatedMarker([x,y], {rotationAngle: rot, icon: icon, rust_type: newMarker[0], steam_id: steamId})

        switch (newMarker[0]) {
        case 1: // player
            console.log(newMarker[4])
            
            icon = createPlayerIcon(newMarker[4].is_alive, newMarker[4].is_online, newMarker[4].steam_id)
            current_pin.setIcon(icon)
            current_pin.bindPopup(`${newMarker[4].name}<br><a href="${newMarker[4].url}">steam page</a>`)
            break;
        case 2: // explosion
            // currently removed
            break;
        case 3: // shop
            icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a", "black")
            current_pin.setIcon(icon)
            break;
        case 4: // CH47
            icon = createCustomIcon(shopGreen,shopGreen,"CH47", "black")
            current_pin.setIcon(icon)
            break;
        case 5: // cargo ship
            icon = createCustomIcon(shopGreen,shopGreen,"cargo", "black")
            current_pin.setIcon(icon)
            break;
        case 6: // crate
            // currently removed
            break;
        case 7: // generic radius (whats that???)
            break;
        case 8: // patrol helicopter
            icon = createCustomIcon(shopGreen,shopGreen,"HELI", "black")
            current_pin.setIcon(icon)
            break;
        default: // this should never happen
            icon = createCustomIcon(shopGreen,shopGreen,"?", "red")
            current_pin.setIcon(icon)
    }
        current_pin.addTo(map)
        map_pins.push(current_pin)
    }
}

function createPlayerIcon(isalive, isonline, steamid){ // show name on hover and open url on click
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

window.onload = function () {
    map = L.map('map-canvas',{ 
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
        popupAnchor: [0, 0]
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
    // setInterval(updateMarkers, 2000);
};