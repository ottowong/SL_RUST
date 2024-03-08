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
let halfWidth = 0
let halfHeight = 0
var playerImages = {};

let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }

img.onload = function() {
    halfWidth = img.width / 2;
    halfHeight = img.height / 2;
    cameraOffset = { x: window.innerWidth / 2 - halfWidth, y: window.innerHeight / 2 - halfHeight };
}

let cameraZoom = 1
let MAX_ZOOM = 5
let MIN_ZOOM = 0.1
let SCROLL_SENSITIVITY = 0.001
let all_markers = []
let all_notes = []
let all_monuments = []
let team_leader = []
let player_to_track = ""
function drawText(ctx, x, y, text) {
    if(text != "")
    {
        ctx.font = "12px Arial";

        let textWidth = ctx.measureText(text).width;
        let textHeight = parseInt(ctx.font);

        // draw semi-transparent rectangle behind text
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x - textWidth / 2 - 9, y - textHeight / 2 - 30, textWidth + 18, textHeight + 7);

        // text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y-25);
        
        // reset these
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }
}

function drawNote(ctx, x, y, size, colour, colour2, type, is_leader) {
    let icon
    switch (type) {
        case 0:
            icon = "";
            break;
        case 1:
            icon = "\uf155"; // Dollar sign
            break;
        case 2:
            icon = "\uf015"; // House
            break;
        case 3:
            icon = "\uf4cd"; // Parachute
            break;
        case 4:
            icon = "\uf05b"; // Crosshair
            break;
        case 5:
            icon = "\uf132"; // Shield
            break;
        case 6:
            icon = "\uf54c"; // Skull
            break;
        case 7:
            icon = "\uf236"; // Bed
            break;
        case 8:
            icon = "Z"; // ZZZ (you have to pay for the zzz emoji)
            break;
        case 9:
            icon = "\ue19b"; // Gun
            break;
        case 10:
            icon = "\uf6fc"; // Rock
            break;
        case 11:
            icon = "\uf03e"; // Picture
            break;
        default:
            icon = ""; // should not happen
            break;
    }
    if (type === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 2); // Bottom point
        ctx.lineTo(x - size / 2, y - size / 2); // Top left point
        ctx.lineTo(x + size / 2, y - size / 2); // Top right point
        ctx.closePath();
        ctx.fillStyle = colour;
        ctx.fill();

        // black border
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        // black border
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000";
        ctx.fill();

        // light colour border
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, 2 * Math.PI);
        ctx.fillStyle = colour;
        ctx.fill();

        // dark colour circle
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, 2 * Math.PI);
        ctx.fillStyle = colour2;
        ctx.fill();

        // Draw FontAwesome icon
        ctx.font = "15px FontAwesome";
        let iconWidth = ctx.measureText(icon).width;
        let iconX = x - iconWidth / 2;

        ctx.fillStyle = colour;
        ctx.fillText(icon, iconX, y + 5);
    }
    if(is_leader){
        ctx.beginPath();
        ctx.arc(x+13, y-13, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x+13, y-13, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#89c02d";
        ctx.fill();
        // draw a circle
        ctx.beginPath();
        ctx.arc(x+13, y-13, 3, 0, 2 * Math.PI);
        if(team_leader[1]){
            ctx.fillStyle = "#89c02d";
        } else {
            ctx.fillStyle = "#283b0b";
        }
        ctx.fill();
    }
}

function draw()
{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
    ctx.scale(cameraZoom, cameraZoom)
    ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y )
    ctx.drawImage(img, 0,0);

    all_monuments.forEach(monument => {
        let text = monument[0]
        let x = (monument[1] / 4500 * 2000);
        let y = (2000 - monument[2] / 4500 * 2000);
        let icon
        let colour = "#282828"
        let colour2 = "#d4cac1"
        var do_text = false;
        switch (text) {
            case "Train Tunnel":
                icon = "\uf238" // train
                break;
            case "Train Tunnel Link":
                icon = "\uf557" // archway (tunnel)
                break;
            case "Dungeonbase":
                do_text = true;
                text = "";
                break;
            case "Stables A":
            case "Stables B":
            case "Fishing Village":
            case "Large Fishing Village":
                do_text = true;
                y=y+30
                break;
            case "Outpost":
            case "Bandit Camp":
                do_text = true;
                y=y+40
                break;
            default:
                do_text = true;
        }
        if(do_text) // if we want text
        {
            ctx.fillStyle = colour;
            ctx.font = "bold 16px 'Comic Sans MS'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, x, y);
            
            // reset these
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
        } else { // if we want an icon
            ctx.beginPath();
            ctx .arc(x, y, 16, 0, 2 * Math.PI);
            ctx.fillStyle = colour2;
            ctx.fill();

            // Draw FontAwesome icon
            ctx.font = "18px FontAwesome";
            let iconWidth = ctx.measureText(icon).width;
            let iconX = x - iconWidth / 2;

            ctx.fillStyle = colour;
            ctx.fillText(icon, iconX, y+7);
        }
    });

    all_markers.forEach(marker => {
        let x = (marker[1] / 4500 * 2000);
        let y = (2000 - marker[2] / 4500 * 2000);
        let angleInRadians = (marker[3] * Math.PI / 180) * -1; // Convert degrees to radians
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleInRadians); // Rotate by the specified angle
        switch (marker[0]) {
            case 1: // player
                if (marker[4]) {
                    var steamId = marker[4].steam_id;
                    var playerImage;
                    if (playerImages[steamId]) {
                        playerImage = playerImages[steamId];
                    } else {
                        // Create a new Image object and store it in the dictionary
                        playerImage = createImage("/static/profilepics/" + steamId + ".jpg");
                        playerImages[steamId] = playerImage;
                    }
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
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    if (player_to_track == steamId){
                        var parentDiv = document.getElementById('map-canvas');
                        var parentWidth = parentDiv.offsetWidth;
                        var parentHeight = parentDiv.offsetHeight;

                        // Calculate the center position of the parent div considering the zoom factor
                        var centerX = parentWidth
                        var centerY = parentHeight/2

                        // Adjust the camera offset to center it on the player's position
                        cameraOffset.x = 0 - x + centerX - 100; // these are not accurate but good enough
                        cameraOffset.y = 0 - y + centerY + 100;
                    }
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
    all_notes.forEach(note => {
        let x = (note[1] / 4500 * 2000);
        let y = (2000 - note[2] / 4500 * 2000);
        ctx.save();
        ctx.translate(x, y);
        switch (note[0]) {
            case 0: // death marker
                break;
            case 1: // normal marker
                let colour = "#ffffff";
                let colour2 = "#000000";
                switch (note[4]){
                    case 0: // yellow
                        colour = "#b9bb4c"
                        colour2 = "#454619"
                        break;
                    case 1: // blue
                        colour = "#2e6bb8"
                        colour2 = "#12243f"
                        break;
                    case 2: // green
                        colour = "#72a137"
                        colour2 = "#243510"
                        break;
                    case 3: // red
                        colour = "#ae3534"
                        colour2 = "#371210"
                        break;
                    case 4: // magenta
                        colour = "#9b4fa6"
                        colour2 = "#351a39"
                        break;
                    case 5: // cyan
                        colour = "#0ae8be"
                        colour2 = "#08493a"
                        break;
                    default: // this shouldn't happen
                        colour = "#000000"
                        colour2 = "#ffffff";
                }
                drawNote(ctx, 0, -12, 30, colour, colour2, note[3], note[6]);
                break;
            default:
                ctx.drawImage(redx, 0-redx.width/2, 0-redx.height/2);
        }
        ctx.restore();
    });

    // put text labels on top of other markers
    all_notes.forEach(note => {
        let x = (note[1] / 4500 * 2000);
        let y = (2000 - note[2] / 4500 * 2000);
        ctx.save();
        ctx.translate(x, y);
        drawText(ctx, 0, -12, note[5])
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
    let maxPanDistance = 2000;
    if (isDragging)
    {
        let newx = getEventLocation(e).x/cameraZoom - dragStart.x
        let newy = getEventLocation(e).y/cameraZoom - dragStart.y
        
        // check that user has not scrolled too far
        let quarterWidth = halfWidth/2
        let quarterHeight = halfHeight/2
        if(newx > maxPanDistance-quarterWidth){
            console.log("A")
            console.log(maxPanDistance-quarterWidth)
            newx = maxPanDistance-quarterWidth
        }
        if(newy > maxPanDistance-quarterHeight){
            console.log("B")
            console.log(maxPanDistance-quarterHeight)
            newy = maxPanDistance-quarterHeight
        }
        if(newx < (maxPanDistance + quarterWidth) * -1){
            console.log("C")
            console.log((maxPanDistance + quarterWidth) * -1)
            newx = (maxPanDistance + quarterWidth) * -1
        }
        if(newy < (maxPanDistance + quarterHeight) * -1){
            console.log("D")
            console.log((maxPanDistance + quarterHeight) * -1)
            newy = (maxPanDistance + quarterHeight) * -1
        }

        cameraOffset.x = newx
        cameraOffset.y = newy
        
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