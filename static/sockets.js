document.addEventListener('DOMContentLoaded', function() {
    let socket = io();
    socket.on('connect', function() {
        socket.send('Client connected!');
    });
    socket.on('sent_devices', function(devices) {
        let ul = document.getElementById('device_list');
        ul.innerHTML = '';
        devices.forEach(device => {
            let li = document.createElement('li');
            li.textContent = device[1];
            li.setAttribute('data-id', device[0]);
            ul.appendChild(li);
        });
    });
    socket.on('update_switch', function(info) {
        console.log("UPDATE SWITCH")
        let id = info[0]
        console.log(info)

        let element = document.getElementById(id);
        if (element)
        {
            let statusIndicator = element.querySelector(".status-indicator");
            if(info[1] === undefined){
                statusIndicator.style.backgroundColor = "gray";
            } else if(info[1] === true || info[1] === 1){
                statusIndicator.style.backgroundColor = "green";
            } else if (info[1] === false || info[1] === 0) {
                statusIndicator.style.backgroundColor = "red";
            }
        } else {
            console.log("Element with ID " + id + " not found.");
        }
    });
    socket.on('update_markers', function(markers) {
        all_markers = markers // update global variable
    });
    socket.on('update_notes', function(notes) {
        all_notes = notes // update global variable
    });
    socket.on('update_server_info', function(server_info) {
        document.getElementById('server_name').innerHTML = server_info.name;
        document.getElementById('players_data').innerHTML = server_info.players+"/"+server_info.max_players;
        document.getElementById('queue_data').innerHTML = server_info.queued_players
    });
    socket.on('chat_message', function(message) {
        let chatMessages = $('#chatmessages');
        let messageCount = chatMessages.children().length;
        let isScrolledToBottom = chatMessages.scrollTop() + chatMessages.innerHeight() >= chatMessages[0].scrollHeight;
        
        chatMessages.append('<div><b>' + message[0] + ':</b> ' + message[1] + '</div>');
        if (messageCount > 50) {
            chatMessages.children().first().remove();
        }

        // Scroll to the bottom if already scrolled to the bottom before adding a new message
        if (isScrolledToBottom) {
            chatMessages.scrollTop(chatMessages[0].scrollHeight);
        }
    });
    socket.on('monuments', function(monuments) {
        all_monuments = monuments // update global variable
    });

    let chatInput = document.getElementById('chat_input');

    // Handle sending messages
    chatInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Prevent the default behavior of Enter key
            event.preventDefault();
            let message = chatInput.value.trim();

            if (message !== '') {
                console.log('Sending message: ' + message);
                socket.emit('send_message', message);

                // Clear the input box
                chatInput.value = '';
            }
        }
    });
});

$(document).ready(function() {
    let socket = io();

    // Function to handle turning the device on
    function turnOn(deviceId) {
        socket.emit('turn_on', deviceId);
    }

    // Function to handle turning the device off
    function turnOff(deviceId) {
        socket.emit('turn_off', deviceId);
    }

    function toggle(deviceId) {
        socket.emit('toggle', deviceId);
    }

    $('.toggle-btn').click(function() {
        let deviceId = $(this).data('device-id');
        toggle(deviceId);
    });

});