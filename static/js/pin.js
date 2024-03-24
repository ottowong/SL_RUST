let socket;

function addPin(number) {
    var pinInput = document.getElementById("pinInput");
    if(pinInput.value.length < 4){
        pinInput.value += number;
        var audio = document.getElementById("beepAudio");
        audio.currentTime = 0;
        audio.play();
    } 
    if(pinInput.value.length == 4){
        submitForm();
    }
}

function clearPin() {
    var pinInput = document.getElementById("pinInput");
    pinInput.value = "";
}

function submitForm() {
    var pinInput = document.getElementById("pinInput");
    socket.emit('authenticate', pinInput.value);
}

document.addEventListener('DOMContentLoaded', function() {
    socket = io();

    socket.on('authentication_result', function(success) {
        console.log(success)
        if (success) {
            var successAudio = new Audio('../static/audio/codelock_success.mp3');
            successAudio.onended = function() {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "/codelock", true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            // Redirect to index if the request was successful
                            window.location.href = '/';
                        } else {
                            console.error("Failed to send PIN to server.");
                        }
                    }
                };
                xhr.send("pin=" + encodeURIComponent(pinInput.value));
            };
            successAudio.play();
        } else {
            var failAudio = new Audio('../static/audio/codelock_failure.mp3');
            failAudio.onended = function() {
                pinInput.value = "";
            };
            failAudio.play();
        }
    });

    document.addEventListener("keydown", function(event) {
        // Check if the pressed key is a number key (from 0 to 9)
        if (event.key >= '0' && event.key <= '9') {
            addPin(parseInt(event.key));
        } else if (event.key === 'C') {
            // If C key is pressed, clear the form
            clearPin();
        }
    });
});
