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
        let statusIndicatorOn = document.getElementById(id).getElementsByClassName("status-indicator-on")[0];
        let statusIndicatorOff = document.getElementById(id).getElementsByClassName("status-indicator-off")[0];
        console.log(info)
        console.log(statusIndicatorOn)
        console.log(statusIndicatorOff)

        let element = document.getElementById(id);
        if (element)
        {
            let statusIndicator = element.querySelector(".status-indicator");
            if(info[1] === undefined){
                statusIndicator.style.backgroundColor = "gray";
            } else if(info[1] === true){
                statusIndicator.style.backgroundColor = "green";
            } else if (info[1] === false) {
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
        console.log(server_info);
        document.getElementById('server_name').innerHTML = server_info.name;
        document.getElementById('players_data').innerHTML = server_info.players+"/"+server_info.max_players;
        document.getElementById('queue_data').innerHTML = server_info.queued_players
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

    // Add event listeners to all "On" buttons
    $('.turn-on-btn').click(function() {
        let deviceId = $(this).data('device-id');
        turnOn(deviceId);
    });

    // Add event listeners to all "Off" buttons
    $('.turn-off-btn').click(function() {
        let deviceId = $(this).data('device-id');
        turnOff(deviceId);
    });

    $('.toggle-btn').click(function() {
        let deviceId = $(this).data('device-id');
        toggle(deviceId);
    });

});