// set these dynamically if possible, otherwise in .env
const mapHeight = 4500
const mapWidth = 4500

const pixelHeight = 2000
const pixelWidth = 2000
let boundPadding = 3000

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

const trainWhite = "#d4cac1"
const trainBlack = "#282828"

var cargoIcon = L.icon({
    iconUrl: '../static/cargo.png',
    iconSize:     [50, 50],
    iconAnchor:   [0, 0],
});

var heliIcon = L.icon({
    iconUrl: '../static/patrol.png',
    iconSize:     [50, 50],
    iconAnchor:   [0, 0],
});

var chinookIcon = L.icon({
    iconUrl: '../static/ch47.png',
    iconSize:     [50, 50],
    iconAnchor:   [0, 0],
});

const colourMap = {
    0: { main: "black", second: "white" },
    1: {
        0: { main: mainYellow, second: secondYellow },
        1: { main: mainBlue, second: secondBlue },
        2: { main: mainGreen, second: secondGreen },
        3: { main: mainRed, second: secondRed },
        4: { main: mainMagenta, second: secondMagenta },
        5: { main: mainCyan, second: secondCyan }
    }
};

const textMap = {
    0: "",
    1: {
        0: "",
        1: "&#xf155;",
        2: "&#xf015;",
        3: "&#xf4cd;",
        4: "&#xf05b;",
        5: "&#xf132;",
        6: "&#xf54c;",
        7: "&#xf236;",
        8: "Z",
        9: "&#xf19b;",
        10: "&#xf6fc;",
        11: "&#xf03e;"
    }
};

var map;

var player_to_track = "";
var map_pins = [];
var note_pins = [];
var monument_pins = [];

function updateMonuments(newMonuments) {
    console.log(newMonuments)
    // remove all pins
    for(var i = monument_pins.length - 1; i >= 0; i--){
        map.removeLayer(monument_pins[i])
        monument_pins.splice(i,1)
    }
    for(var monument of newMonuments){
        console.log(monument)
        var y = monument[1] / mapHeight * pixelHeight
        var x = monument[2] / mapWidth * pixelWidth
        var text = monument[0]
        switch (text.toLowerCase()) {
            case "dungeonbase":
                // Do nothing, no marker for Dungeonbase
                break;
            case "train tunnel":
                // Show an image icon for Train Tunnel
                var trainTunnelIcon = createCustomIcon(trainWhite,trainWhite,"&#xf238;",trainBlack)
                var trainTunnelMarker = L.marker([x,y], {icon: trainTunnelIcon}).addTo(map);
                monument_pins.push(trainTunnelMarker);
                break;
            case "train tunnel link":
                // Show an image icon for Train Tunnel Link
                var trainTunnelLinkIcon = createCustomIcon(trainWhite,trainWhite,"&#xf557;",trainBlack)
                var trainTunnelLinkMarker = L.marker([x,y], {icon: trainTunnelLinkIcon}).addTo(map);
                monument_pins.push(trainTunnelLinkMarker);
                break;
            default:
                // For all other cases, just show the text
                var textIcon = L.divIcon({
                    className: 'text-label',
                    html: '<div>' + text + '</div>',
                    iconSize: [50, 20],
                    iconAnchor:   [0, 0]
                });
                var textMarker = L.marker([x,y], {icon: textIcon}).addTo(map);
                monument_pins.push(textMarker);
        }
    }
}

function updateNotes(newNotes) {
    // remove all pins
    for(var i = note_pins.length - 1; i >= 0; i--){
        map.removeLayer(note_pins[i])
        note_pins.splice(i,1)
    }
    for(var note of newNotes){
        var y = note[1] / mapHeight * pixelHeight
        var x = note[2] / mapWidth * pixelWidth
        let icon = createCustomIcon(shopGreen,shopGreen,"?", "red")
        let colour = "white";
        let colour2 = "black";

        switch (note[0]) {
            case 0: // death marker
                break;
            case 1: // normal marker
                const colors = colourMap[1][note[4]] || colourMap[0]; // Default to black and white if note[4] is invalid
                const { main, second } = colors;
                const text = textMap[1][note[3]] || textMap[0];
                icon = createCustomIcon(main, second, text);
                let current_pin = L.rotatedMarker([x, y], {
                    icon: icon
                });
                current_pin.addTo(map);
                note_pins.push(current_pin);
                // do something to make sure they are in front of shop markers
                break;
            default:
                break;
        }
    }
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
                    // Player tracking
                    if (pin.options.steam_id == player_to_track){
                        map.panTo(new L.LatLng(temp_x, temp_y));
                    }
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
        icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a;", "black")
        let steamId;
        if(newMarker[0] == 1){
            steamId = newMarker[4].steam_id
        }
        let current_pin = L.rotatedMarker([x,y], {
            rotationAngle: rot, 
            rotationOrigin: "center",
            icon: icon, 
            rust_type: newMarker[0], 
            steam_id: steamId
        })

        switch (newMarker[0]) {
        case 1: // player
            icon = createPlayerIcon(newMarker[4].is_alive, newMarker[4].is_online, newMarker[4].steam_id)
            current_pin.setIcon(icon)
            current_pin.bindPopup(`${newMarker[4].name}<br><a href="${newMarker[4].profile_url}">steam page</a>`)
            break;
        case 2: // explosion
            // currently removed
            break;
        case 3: // shop
            icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a;", "black")
            current_pin.setIcon(icon)
            break;
        case 4: // CH47
            current_pin.setIcon(chinookIcon)
            break;
        case 5: // cargo ship
            current_pin.setIcon(cargoIcon)
            break;
        case 6: // crate
            // currently removed
            break;
        case 7: // generic radius (whats that???)
            break;
        case 8: // patrol helicopter
            current_pin.setIcon(heliIcon)
            break;
        default: // this should never happen
            icon = createCustomIcon(shopGreen,shopGreen,"?", "red")
            current_pin.setIcon(icon)
    }
        current_pin.addTo(map)
        map_pins.push(current_pin)
    }
}

function createPlayerIcon(isalive, isonline, steamid){
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
            ${icon}
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
        minZoom: -4,
        maxZoom: 5
    }).setView([1000, 1000], -2);
    map.addControl(new L.Control.Fullscreen());

    var imageUrl = '../static/map.png';

    var imageSize = [pixelHeight, pixelWidth];
    var imageBounds = [[0, 0], imageSize];

    L.imageOverlay(imageUrl, imageBounds).addTo(map);

    var maxBounds = L.latLngBounds([
        [0 - boundPadding, 0 - boundPadding], 
        [pixelHeight + boundPadding, pixelWidth + boundPadding]
    ]);
    map.setMaxBounds(maxBounds);
};
