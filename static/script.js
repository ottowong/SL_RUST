function createImage(url) {
    var img = new Image();
    img.src = url;
    return img;
}

var canvas = document.getElementById('map_canvas');
canvas.style.background = "#0b3a4a"
var ctx = canvas.getContext('2d');
var img = new Image();
var shop = new Image();
var redx = new Image();
var explosion = new Image();
var ch47 = new Image();
var cargo = new Image();
var crate = new Image();
var genrad = new Image();
var patrol = new Image();
img.src = "/static/map.png";
redx.src = "/static/redx.png";
shop.src = "/static/shop.png";
explosion.src = "/static/explosion.png";
ch47.src = "/static/ch47.png";
cargo.src = "/static/cargo.png";
crate.src = "/static/crate.png";
genrad.src = "/static/genrad.png";
patrol.src = "/static/patrol.png";

let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }

img.onload = function() {
    let halfWidth = img.width / 2;
    let halfHeight = img.height / 2;
    cameraOffset = { x: window.innerWidth / 2 - halfWidth, y: window.innerHeight / 2 - halfHeight };
}

let cameraZoom = 0.5
let MAX_ZOOM = 5
let MIN_ZOOM = 0.1
let SCROLL_SENSITIVITY = 0.001
let all_markers = []

function draw()
{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
    ctx.scale(cameraZoom, cameraZoom)
    ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y )
    ctx.drawImage(img, 0,0);
    all_markers.forEach(marker => {
        let x = (marker[1] / 4500 * 2000);
        let y = (2000 - marker[2] / 4500 * 2000);
        let angleInRadians = (marker[3] * Math.PI / 180) * -1; // Convert degrees to radians
        ctx.save(); // Save the current context state
        ctx.translate(x, y); // Translate to the marker position
        ctx.rotate(angleInRadians); // Rotate by the specified angle
        switch (marker[0]) {
            case 1: // player
                if (marker[4]) {
                    var playerImage = createImage("/static/profilepics/"+marker[4].steam_id+".jpg"); // find a way to not create a new image every time (?)
                    // crop to be a circle
                    ctx.save(); 
                    ctx.beginPath();
                    ctx.arc(0, 0, 16, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(playerImage, -16, -16, 32, 32);
                    ctx.restore();
                    
                    // overlay
                    if (!marker[4].is_alive){
                        ctx.beginPath();
                        ctx.arc(0, 0, 16, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                        ctx.fill();
                    }

                    // border circle
                    ctx.beginPath();
                    ctx.arc(0, 0, 17, 0, Math.PI * 2);
                    if (marker[4].is_online){
                        ctx.strokeStyle = '#00ff00';
                    } else {
                        ctx.strokeStyle = '#7d7d7d';
                    }
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                break;
            case 2: // explosion
                ctx.drawImage(explosion, 0-explosion.width/2, 0-explosion.height/2);
                break;
            case 3: // shop
                ctx.drawImage(shop, 0-shop.width/2, 0-shop.height/2);
                break;
            case 4: // CH47
                ctx.drawImage(ch47, 0-ch47.width/2, 0-ch47.height/2);
                break;
            case 5: // cargo ship
                ctx.drawImage(cargo, 0-cargo.width/2, 0-cargo.height/2);
                break;
            case 6: // crate
                ctx.drawImage(crate, 0-crate.width/2, 0-crate.height/2);
                break;
            case 7: // generic radius (whats that???)
                ctx.drawImage(genrad, 0-genrad.width/2, 0-genrad.height/2);
                break;
            case 8: // patrol helicopter
                ctx.drawImage(patrol, 0-patrol.width/2, 0-patrol.height/2);
                break;
            default:
                ctx.drawImage(redx, 0-redx.width/2, 0-redx.height/2);
        }
        ctx.restore();
    });
    ctx.beginPath();
    requestAnimationFrame( draw )
}

function getEventLocation(e)
{
    if (e.touches && e.touches.length == 1)
    {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY)
    {
        return { x: e.clientX, y: e.clientY }        
    }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e)
{
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
    if (isDragging)
    {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    }
}

function handleTouch(e, singleTouchHandler)
{
    if ( e.touches.length == 1 )
    {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2)
    {
        isDragging = false
        handlePinch(e)
    }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e)
{
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null)
    {
        initialPinchDistance = currentDistance
    }
    else
    {
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor)
{
    if (!isDragging)
    {
        if (zoomAmount)
        {
            cameraZoom -= zoomAmount
        }
        else if (zoomFactor)
        {
            console.log(zoomFactor)
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        
        console.log(zoomAmount)
    }
}

canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))

draw()

document.addEventListener('DOMContentLoaded', function() {
    var socket = io();
    socket.on('connect', function() {
        socket.send('Client connected!');
    });
    socket.on('sent_devices', function(devices) {
        var ul = document.getElementById('device_list');
        ul.innerHTML = '';
        devices.forEach(device => {
            var li = document.createElement('li');
            li.textContent = device[1];
            li.setAttribute('data-id', device[0]);
            ul.appendChild(li);
        });
    });
    socket.on('update_markers', function(markers) {
        all_markers = markers // update global variable, probably a better way of doing this, but the pan/zoom code makes that harder.
    });
});