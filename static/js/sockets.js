document.addEventListener('DOMContentLoaded', function() {
    let socket = io();
    function toggle(deviceId) {
        console.log(deviceId)
        socket.emit('toggle', deviceId);
    }
    socket.on('connect', function() {
        socket.send('Client connected!');
    });
    // create the list of switches
    socket.on('sent_switches', function(switches) {
        console.log("got switches")
        console.log(switches)
        
        let parentDiv = document.getElementById('device_list');
        parentDiv.innerHTML = '';
    
        switches.forEach(device => {
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

    socket.on('sent_monitors', function(monitors) {
        monitors.forEach(device => {
            monitor_id = device[0]
            monitor_name = device[1]
            // make monitor div stuff here
        });
    });

    socket.on('update_monitor', function(monitor) {
        console.log(monitor)
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
        updateMarkers(markers)
    });
    socket.on('update_notes', function(notes) {
        updateNotes(notes)
    });
    socket.on('monuments', function(monuments) {
        updateMonuments(monuments) // update global variable
    });
    socket.on('update_server_info', function(server_info) {
        document.getElementById('server_name').innerHTML = server_info.name;
        let queueTimeHeader = document.getElementById('queue-time-header');
        let playerStr = server_info.players+"/"+server_info.max_players;
        if(server_info.queued_players > 0){
            queueTimeHeader.style.display = 'block';

            var queuedMinutes = server_info.queued_players;
            playerStr += " (" + queuedMinutes + ")"
            queuedMinutes = queuedMinutes * .5;
            var hours = Math.floor(queuedMinutes / 60);
            var minutes = queuedMinutes % 60;

            var displayText;
            if (hours > 0) {
                displayText = hours + "h ";
                if (minutes > 0) {
                    displayText += minutes + "m";
                }
            } else {
                displayText = minutes + "m";
            }

document.getElementById('time-queue').innerHTML = displayText;

        } else {
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

    socket.on('update_steam_members', function(steam_members) {
        var userList = document.querySelector('.user-list');
        // userList.innerHTML = ''; // Clear previous content
    
        for (var steamId in steam_members) {
            if(document.getElementById(steamId)){
                break;
            }
            var member = steam_members[steamId];
            if(member["is_leader"]){
                team_leader = [steamId,steam_members[steamId]["is_online"]] // update global variable
            }
            console.log(member)
            // list item
            var listItem = document.createElement('li');
            listItem.classList.add('user-item');
            listItem.setAttribute('id', steamId);
        
            // profile pic
            var img = document.createElement('img');
            img.setAttribute('src', member.url);
            img.setAttribute('alt', 'Profile Picture');
            listItem.appendChild(img);
        
            var div = document.createElement('div');
        
            // name
            var h3 = document.createElement('h3');
            var spanName = document.createElement('a');
            spanName.textContent = member.name;
            spanName.setAttribute('href', member.profile_url);
            spanName.setAttribute('target', '_blank');

            var statusSpan = document.createElement('span');
            statusSpan.textContent = getStateText(member.state);
            if (member.state === 1) {
                // #8cbb55 in-game green
                spanName.style.color = '#62b7da'; // Blue for Online
                statusSpan.style.color = '#62b7da'; // Blue for Online
            } else {
                spanName.style.color = 'gray'; // Gray for Offline and other states
                statusSpan.style.color = 'gray'; // Gray for Offline and other states
            }
            h3.appendChild(spanName);
            div.appendChild(h3);

            var p = document.createElement('p');
            p.textContent = 'Status: ';
            p.appendChild(statusSpan);
            div.appendChild(p);
        
            listItem.appendChild(div);
            userList.appendChild(listItem);
        
            // Create and append the trackDiv
            var trackDiv = document.createElement('div');
            trackDiv.classList.add('track-div');
            var crosshairIcon = document.createElement('i');
            crosshairIcon.classList.add('fas', 'fa-crosshairs');
            trackDiv.appendChild(crosshairIcon);
            listItem.appendChild(trackDiv);
        
            // Position the trackDiv at the bottom right of the listItem
            trackDiv.style.position = 'relative';
            trackDiv.style.bottom = '10px';
            trackDiv.style.right = '10px';
        
            // Add click event listener for tracking
            trackDiv.addEventListener('click', function(event) {
                var steamId = event.currentTarget.parentNode.id;
                if(player_to_track == steamId){
                    player_to_track = "" // reset if clicked twice
                    event.currentTarget.querySelector('i').style.color = 'gray';
                } else {
                    if (player_to_track) {
                        var previousTrackDiv = document.getElementById(player_to_track).querySelector('.track-div');
                        if (previousTrackDiv) {
                            previousTrackDiv.querySelector('i').style.color = 'gray';
                        }
                    }
                    event.currentTarget.querySelector('i').style.color = 'red';
                    player_to_track = steamId;
                }
                console.log(player_to_track)
            });
        }
        
    });
    
    socket.on('update_time', function(rust_time) {
        let server_time = document.getElementById('server-time');
        server_time.innerHTML = rust_time;
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