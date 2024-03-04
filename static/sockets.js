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
    socket.on('update_notes', function(notes) {
        all_notes = notes // update global variable, probably a better way of doing this, but the pan/zoom code makes that harder.
    });
    socket.on('update_server_info', function(server_info) {
        console.log(server_info);
        document.getElementById('server_name').innerHTML = server_info.name;
        document.getElementById('players_data').innerHTML = server_info.players+"/"+server_info.max_players;
        document.getElementById('queue_data').innerHTML = server_info.queued_players
    });
});

$(document).ready(function() {
    var socket = io();

    // Function to handle turning the device on
    function turnOn(deviceId) {
        socket.emit('turn_on', deviceId);
    }

    // Function to handle turning the device off
    function turnOff(deviceId) {
        socket.emit('turn_off', deviceId);
    }

    // Add event listeners to all "On" buttons
    $('.turn-on-btn').click(function() {
        var deviceId = $(this).data('device-id');
        turnOn(deviceId);
    });

    // Add event listeners to all "Off" buttons
    $('.turn-off-btn').click(function() {
        var deviceId = $(this).data('device-id');
        turnOff(deviceId);
    });
});