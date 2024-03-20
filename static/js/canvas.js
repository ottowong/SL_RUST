window.onload = function () {
    var map = L.map('map-canvas',{ 
        crs: L.CRS.Simple, // use px coords
        zoom: -2,
        minZoom: -2,
        maxZoom: 5
    }).setView([1000, 1000], -2);

    var shopIcon = L.icon({
        iconUrl: '../static/shop.png',
        iconSize: [25, 25], // original size of the icon
        iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
        popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
    });

    var imageUrl = '../static/map.png';
    let width = 2000
    let height = 2000
    let boundPadding = 1000

    let halfwidth = width / 2
    let halfheight = height / 2

    var imageSize = [height, width];
    var imageBounds = [[0, 0], imageSize];

    L.imageOverlay(imageUrl, imageBounds).addTo(map);

    //// rotated marker
    // L.rotatedMarker([0,0], {
    //     icon: shopIcon,
    //     rotationAngle: 90,
    // }).addTo(map);

    var maxBounds = L.latLngBounds([
        [0 - boundPadding, 0 - boundPadding], 
        [height + boundPadding, width + boundPadding]
    ]);
    map.setMaxBounds(maxBounds);
};