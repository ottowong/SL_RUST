var all_markers;

window.onload = function () {
    var map = L.map('map-canvas',{ 
        crs: L.CRS.Simple, // use px coords
        zoom: -2,
        minZoom: -2,
        maxZoom: 5
    }).setView([1000, 1000], -2);

    var shopIcon = L.icon({
        iconUrl: '../static/shop.png',
        iconSize: [25, 25],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
    });

    var imageUrl = '../static/map.png';
    let width = 2000
    let height = 2000
    let boundPadding = 1000

    var imageSize = [height, width];
    var imageBounds = [[0, 0], imageSize];

    L.imageOverlay(imageUrl, imageBounds).addTo(map);

    // rotated marker example
    // let marko = L.rotatedMarker([0,0], {
    //     icon: shopIcon,
    //     rotationAngle: 90,
    // }).addTo(map);
    // marko.setRotationAngle(180)

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
        all_markers.forEach(function(coord) {
            var y = coord[1] / 4500 * 2000
            var x = coord[2] / 4500 * 2000
            L.marker([x,y], {icon: shopIcon}).addTo(map);
        });
    }

    setInterval(updateMarkers, 1000);
};