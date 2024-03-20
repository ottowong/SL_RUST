var map = L.map('map-canvas',{ 
    crs: L.CRS.Simple, // use px coords
    zoom: -2,
    minZoom: -2,
    maxZoom: 5
}).setView([1000, 1000], -2);

var imageUrl = '../static/map.png';
let width = 2000
let height = 2000
let boundPadding = 1000

let halfwidth = width / 2
let halfheight = height / 2

var imageSize = [height, width];
var imageBounds = [[0, 0], imageSize];

L.imageOverlay(imageUrl, imageBounds).addTo(map);

let marko = L.marker([0, 0]).addTo(map);

var maxBounds = L.latLngBounds([
    [0 - boundPadding, 0 - boundPadding], 
    [height + boundPadding, width + boundPadding]
]);
map.setMaxBounds(maxBounds);