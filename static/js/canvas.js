// set these dynamically if possible, otherwise in .env
const mapHeight = 4500
const mapWidth = 4500

const pixelHeight = 2000
const pixelWidth = 2000

const shopGreen = "#aaef35"

const mainRed = "#ae3534"
const secondRed = "#371210"

var map_pins = [];
var map;

function updateNotes(newNotes) {
    // TO DO
}

function updateMarkers(socket_markers) {
    // console.log("updateMarkers")
    console.log(socket_markers)
    // Remove existing pins from the map
    for (var i = map_pins.length - 1; i >= 0; i--) { // iterate backwards because removing stuff breaks it otherwise
        let pin = map_pins[i]
        var index = map_pins.indexOf(pin);
        // console.log("type",pin.options.rust_type)

        // these will be removed regardless
        if (index !== -1 && [4, 5, 8].includes(pin.options.rust_type)) { // CH47; Cargo; Heli
            map.removeLayer(pin); // DELETE pins from the map
            map_pins.splice(index, 1); // remove from the global variable
        } 
        // these will be removed if they no longer exist. Players will be updated if they still exist
        else if (index !== -1 && [1, 2, 3, 6, 7].includes(pin.options.rust_type)) { // Player, Explosion, Shop, Crate, GenericRadius
            for (var j = socket_markers.length - 1; j >= 0; j--){
                let current_marker = socket_markers[j]
                let pinLatLng = pin.getLatLng()
                let temp_x = current_marker[2] / mapWidth * pixelWidth
                let temp_y = current_marker[1] / mapHeight * pixelHeight
                if(pin.options.rust_type == current_marker[0] && temp_y == pinLatLng.lng && temp_x == pinLatLng.lat)
                { // if an exact match exists in both
                    socket_markers.splice(j,1) // remove from the NEW list so that it is not re-added
                } else if(pin.options.rust_type == 1) { // if it exists in pins but not the new data (e.g. a shop is destroyed)
                    pin.setLatLng([temp_x, temp_y])
                } else {
                    map.removeLayer(pin); // DELETE pins from the map
                    map_pins.splice(index, 1); // remove from the global variable
                }
            }
        }
    }
    for (var k = socket_markers.length - 1; k >= 0; k--){
        let newMarker = socket_markers[k]
        var y = newMarker[1] / mapHeight * pixelHeight
        var x = newMarker[2] / mapWidth * pixelWidth
        var rot = newMarker[3] * -1 // double check the rotation is correct
        let icon;
        icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a", "black")
        // if([4, 5, 8].includes(newMarker[0])){ // these will be added regardless
        let current_pin = L.rotatedMarker([x,y], {rotationAngle: rot, icon: icon, rust_type: newMarker[0]}).addTo(map)
        current_pin.bindPopup(`${newMarker[0]}<br>${rot}`)
        map_pins.push(current_pin)
        // } else if (true) { // ACTUALLY SHOULD JUST BE ABLE TO ADD THEM ALL! (if we remove them above)
        // }
    }
}

    // add new markers
    // console.log("map_pins",map_pins)

    // console.log("map_pins",map_pins)
    // console.log("all",socket_markers)

    // socket_markers.forEach(function(marker){
        
    //     let icon;
    //     var current_marker = L.rotatedMarker([x,y], {rotationAngle: rot, rust_type: marker[0]})


    //     // switch (marker[0]) {
    //     //     case 1: // player
    //     //         console.log(marker[4])
                
    //     //         icon = createPlayerIcon(marker[4].is_alive, marker[4].is_online, marker[4].steam_id)
    //     //         current_marker.setIcon(icon)
    //     //         current_marker.bindPopup(`${marker[4].name}<br><a href="${marker[4].url}">steam page</a>`)
    //     //         // current_marker.on('click', onClick).on('click', function(e) { window.open(marker[4].profile_url) });
    //     //         break;
    //     //     case 2: // explosion
    //     //         // currently removed
    //     //         break;
    //     //     case 3: // shop
    //     //         icon = createCustomIcon(shopGreen,shopGreen,"&#xf07a", "black")
    //     //         current_marker.setIcon(icon)
    //     //         break;
    //     //     case 4: // CH47
    //     //         icon = createCustomIcon(shopGreen,shopGreen,"CH47", "black")
    //     //         current_marker.setIcon(icon)
    //     //         break;
    //     //     case 5: // cargo ship
    //     //         icon = createCustomIcon(shopGreen,shopGreen,"cargo", "black")
    //     //         current_marker.setIcon(icon)
    //     //         break;
    //     //     case 6: // crate
    //     //         // currently removed
    //     //         break;
    //     //     case 7: // generic radius (whats that???)
    //     //         break;
    //     //     case 8: // patrol helicopter
    //     //         icon = createCustomIcon(shopGreen,shopGreen,"HELI", "black")
    //     //         current_marker.setIcon(icon)
    //     //         break;
    //     //     default: // this should never happen
    //     //         icon = createCustomIcon(shopGreen,shopGreen,"?", "red")
    //     //         current_marker.setIcon(icon)
    //     // }

        
    //     current_marker.addTo(map)
    //     map_pins.push(current_marker)
    // });

    // Add markers from the coordinates array
    // map_pins.forEach(function(marker) {
        
        // icon = createCustomIcon(shopGreen,shopGreen,"?", "red")
        // marker.setIcon(icon)
        // marker.addTo(map)
        // L.rotatedMarker([x,y], {icon: icon, rotationAngle: rot}).on('click', onClick).addTo(map);
    // });


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

    

    

    function onClick(e) {
        console.log(this.getLatLng());
    }

    // setInterval(updateMarkers, 2000);
};