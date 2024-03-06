document.addEventListener('DOMContentLoaded', function() {
    let socket = io();
    function toggle(deviceId) {
        console.log(deviceId)
        socket.emit('toggle', deviceId);
    }
    socket.on('connect', function() {
        socket.send('Client connected!');
    });
    // create the list of devices (just switches for now)
    socket.on('sent_devices', function(devices) {
        console.log("got devices")
        console.log(devices)
        
        let parentDiv = document.getElementById('device_list');
        parentDiv.innerHTML = '';
    
        devices.forEach(device => {
            let listItemDiv = document.createElement('div');
            listItemDiv.classList.add('list-item');
    
            let iconDiv = document.createElement('div');
            iconDiv.classList.add('icon');
            let iconImg = document.createElement('img');
            iconImg.setAttribute('src', '/static/img/switch.png');
            iconImg.setAttribute('alt', 'Icon');
    
            iconDiv.appendChild(iconImg);
    
            let nameDiv = document.createElement('div');
            nameDiv.classList.add('name');
            nameDiv.textContent = device[1];
    
            let statusDiv = document.createElement('div');
            statusDiv.classList.add('status');
            statusDiv.setAttribute('id', device[0]);
            statusDiv.setAttribute('data-device-id', device[0]);
    
            if (device[2] === 1) {
                statusDiv.textContent = 'Online';
                statusDiv.style.color = 'green';
            } else if (device[2] === 0) {
                statusDiv.textContent = 'Offline';
                statusDiv.style.color = 'red';
            } else {
                statusDiv.textContent = 'Undefined';
                statusDiv.style.color = 'gray';
            }

            statusDiv.addEventListener('click', function() {
                let deviceId = $(this).data('device-id');
                toggle(deviceId);
            });
    
            listItemDiv.appendChild(iconDiv);
            listItemDiv.appendChild(nameDiv);
            listItemDiv.appendChild(statusDiv);
    
            parentDiv.appendChild(listItemDiv);
        });
    });
    // if some switch data is wrong, update it here.
    socket.on('update_switch', function(info) {
        let id = info[0]
        console.log(info)
        let element = document.getElementById(id);
        if (element)
        {
            let statusIndicator = element.querySelector(".status-indicator");
            if(info[1] === undefined){
                element.innerHTML = "No Signal";
                element.style.color = "gray";
            } else if(info[1] === true || info[1] === 1){
                element.innerHTML = "Online";
                element.style.color = "green";
            } else if (info[1] === false || info[1] === 0) {
                element.innerHTML = "Offline";
                element.style.color = "red";
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
        let queueTimeHeader = document.getElementById('queue-time-header');
        let playerStr = server_info.players+"/"+server_info.max_players;
        if(server_info.queued_players > 0){
            queueTimeHeader.style.display = 'block';
            playerStr += " (" + server_info.queued_players + ")"
        } else {
            console.log("hide thing")
            queueTimeHeader.style.display = 'none';
        }
        document.getElementById('player-count').innerHTML = playerStr

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

    socket.on('update_steam_members', function(steam_members) {
        var userList = document.querySelector('.user-list');
        userList.innerHTML = ''; // Clear previous content
    
        for (var steamId in steam_members) {
            var member = steam_members[steamId];
            if(member["is_leader"]){
                team_leader = [steamId,steam_members[steamId]["is_online"]] // update global variable
            }
            console.log(member)
            // Create li element
            var listItem = document.createElement('li');
            listItem.classList.add('user-item');
    
            // Create img element
            var img = document.createElement('img');
            img.setAttribute('src', member.url);
            img.setAttribute('alt', 'Profile Picture');
            listItem.appendChild(img);
    
            // Create div element
            var div = document.createElement('div');
    
            // Create h3 element
            var h3 = document.createElement('h3');
            var spanName = document.createElement('a');
            spanName.textContent = member.name;
            spanName.setAttribute('href', member.profile_url);
            spanName.setAttribute('target', '_blank');
            if (member.state === 1) {
                spanName.style.color = '#8cbb55'; // Green for Online
            } else {
                spanName.style.color = 'gray'; // Gray for Offline and other states
            }
            h3.appendChild(spanName);
            div.appendChild(h3);
    
            // Create p element
            var p = document.createElement('p');
            p.textContent = 'Status: ' + getStateText(member.state);
            div.appendChild(p);
    
            listItem.appendChild(div);
            userList.appendChild(listItem);
        }
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

function getStateText(state) {
    switch (state) {
        case 0:
            return 'Offline';
        case 1:
            return 'Online';
        case 2:
            return 'Busy';
        case 3:
            return 'Away';
        case 4:
            return 'Snooze';
        case 5:
            return 'Looking to trade';
        case 6:
            return 'Looking to play';
        default:
            return 'Unknown';
    }
}