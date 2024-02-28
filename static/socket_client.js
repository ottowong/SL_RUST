document.addEventListener('DOMContentLoaded', function() {
    var socket = io();
    socket.on('connect', function() {
        socket.send('Client connected!');
        socket.emit('request_devices')
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
            
            // Set the text content of the list item to be the device name
            li.textContent = device[1];
            
            // Set any additional attributes or data as needed
            li.setAttribute('data-id', device[0]); // Example: set data-id attribute to the device ID
            
            // Append the list item to the unordered list
            ul.appendChild(li);
        });
    });
    socket.on('update', function(data) {
        console.log('Received update:', data);
        // Perform actions to update the UI or handle data received from the server
    });
});