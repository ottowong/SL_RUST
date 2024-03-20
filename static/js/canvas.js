var map = L.map('map-canvas').setView([0, 0], 0);

var imageUrl = 'https://i.imgur.com/s1NGZQY.png';
// Determine the aspect ratio of your image
var imageWidth = 2000; // Width of your image in pixels
var imageHeight = 2000; // Height of your image in pixels
var aspectRatio = imageWidth / imageHeight;

// Set bounds with the correct aspect ratio
var latitudeSpan = 360; // Total latitude span (-90 to 90)
var longitudeSpan = 360; // Total longitude span (-180 to 180)
var latitudeCenter = 0; // Center latitude
var longitudeCenter = 0; // Center longitude

var latitudeHalfSpan = latitudeSpan / 2;
var longitudeHalfSpan = latitudeHalfSpan * aspectRatio;

var imageBounds = [
    [latitudeCenter - latitudeHalfSpan, longitudeCenter - longitudeHalfSpan], // Southwest corner
    [latitudeCenter + latitudeHalfSpan, longitudeCenter + longitudeHalfSpan]  // Northeast corner
];

L.imageOverlay(imageUrl, imageBounds).addTo(map);




map.on('zoomend', function(event) {
    // Get the current center coordinates and zoom level
    var center = map.getCenter();
    var zoom = map.getZoom();

    // Log the x, y (latitude, longitude), and zoom level
    console.log('Center X (latitude):', center.lat);
    console.log('Center Y (longitude):', center.lng);
    console.log('Zoom level:', zoom);
});
