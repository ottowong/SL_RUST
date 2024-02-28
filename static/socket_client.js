document.addEventListener('DOMContentLoaded', function() {
    var socket = io();
    socket.on('connect', function() {
        socket.send('Client connected!');
    });
    socket.on('response', function(data) {
        console.log(data);
    });
    socket.on('sent_devices', function(devices) {
        var ul = document.getElementById('device_list');
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }
        devices.forEach(device => {
            var li = document.createElement('li');
            li.textContent = device[1];
            li.setAttribute('data-id', device[0]);
            ul.appendChild(li);
        });
    });
    socket.on('update', function(data) {
        console.log('Received update:', data);
        // Perform actions to update the UI or handle data received from the server
    });
});