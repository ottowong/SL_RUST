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
});