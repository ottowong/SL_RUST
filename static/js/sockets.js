document.addEventListener('DOMContentLoaded', function() {
    let socket = io();
    function toggle(deviceId) {
        console.log(deviceId)
        socket.emit('toggle', deviceId);
    }
    socket.on('connect', function() {
        socket.send('Client connected!');
        socket.emit('get_devices');
    });
    // create the list of switches
    // socket.on('sent_switches', function(switches) {
    //     console.log("got switches")
    //     console.log(switches)
        
    //     document.getElementById('switch_list').innerHTML = '';
    
    //     switches.forEach(device => {
    //         create_switch_div(device)
    //     });
    // });

    function create_switch_div(device){
        // check if already exists
        let parentDiv = document.getElementById('switch_list');
        console.log(device)
        let listItemDiv = document.createElement('div');
        listItemDiv.classList.add('list-item');
        listItemDiv.classList.add(`device-${device.id}`);

        let iconDiv = document.createElement('div');
        iconDiv.classList.add('icon');
        let iconImg = document.createElement('img');
        iconImg.setAttribute('src', '/static/img/items/smart.switch.png');
        iconImg.setAttribute('alt', 'Icon');

        iconDiv.appendChild(iconImg);

        let nameDiv = document.createElement('div');
        nameDiv.classList.add('name');
        nameDiv.textContent = device.name;

        let statusDiv = document.createElement('div');
        statusDiv.classList.add('status');
        statusDiv.setAttribute('id', device.id);
        statusDiv.setAttribute('data-device-id', device.id);

        if (device.status === 1) {
            statusDiv.textContent = 'Online';
            statusDiv.style.color = 'green';
        } else if (device.status === 0) {
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
    }

    socket.on('all_monitors', function(monitors) {
        all_monitors = monitors;

        for (let i = 0; i < all_monitors.length; i++){
            let monitor = all_monitors[i]
            add_box_to_list(monitor)
        }

        //#region overview tab
        let all_items = combineMonitors()
        for (const itemId in all_items.items) {
            const item = all_items.items[itemId];
            add_inventory_item_to_overview(itemId, item, false)
            if (explosives_list.includes(itemId)) {
                add_inventory_item_to_explosives(itemId, item)
            }
        }
        for (const bpId in all_items.bps) {
            const bp = all_items.bps[bpId];
            add_inventory_item_to_overview(itemId, bp, true)
        }
        //#endregion overview tab
    });

    socket.on('update_monitor', function(monitor) { // TO DO
        console.log("monitor",monitor.entity_id)
        console.log("all_monitors",all_monitors)
    });

    // if some switch data is wrong, update it here.
    socket.on('update_switch', function(switch_data) {
        let switch_id = switch_data.id
        let switch_value = switch_data.value
        console.log(switch_data)
        let element = document.getElementById(switch_id);
        if (element)
        {
            if(switch_value === undefined){
                element.innerHTML = "No Signal";
                element.style.color = "gray";
            } else if(switch_value === true || switch_value === 1){
                element.innerHTML = "Online";
                element.style.color = "green";
            } else if (switch_value === false || switch_value === 0) {
                element.innerHTML = "Offline";
                element.style.color = "red";
            }
        } else {
            console.log("Element with ID " + switch_id + " not found.");
        }
    });
    socket.on('update_markers', function(markers) {
        updateMarkers(markers)
    });
    socket.on('update_notes', function(notes) {
        updateNotes(notes)
    });
    socket.on('monuments', function(monuments) {
        updateMonuments(monuments)
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
        let chatMessages = $('#messages');
        let messageCount = chatMessages.children().length;
        let isScrolledToBottom = chatMessages.scrollTop() + chatMessages.innerHeight() >= chatMessages[0].scrollHeight;
        
        chatMessages.append('<div class="chat-message-containter"><span class="chat-username">' + message[0] + ':</span><span class="chat-message"> ' + message[1] + '</span></div>');
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

    // device list/form stuff
    socket.on('devices_list', function (devices) {
        $('#switchList').empty();
        $('#alarmList').empty();
        $('#monitorList').empty();
        for (var section in devices) {
            if (devices.hasOwnProperty(section)) {
                var sectionDevices = devices[section];
                for (var i = 0; i < sectionDevices.length; i++) {
                    var device = sectionDevices[i];
                    if(section == "switch"){
                        addSwitchToList(device)
                    }else if(section == "alarm"){
                        addAlarmToList(device)
                    }else if(section == "monitor"){
                        addMonitorToList(device)
                    }
                }
            }
        }
    });

    socket.on('switch_added', function (device) {
        addSwitchToList(device);
    });
    socket.on('alarm_added', function (device) {
        addAlarmToList(device);
    });
    socket.on('monitor_added', function (device) {
        addMonitorToList(device);
    });

    socket.on('device_removed', function (device_id) {
        console.log("try remove device", device_id)
        removeDeviceFromList(device_id);
    });

    // Function to add device to the list
    function addSwitchToList(device) {
        console.log("try add switch", device)
        create_switch_div(device)
        $(`#switchList`).append(`
        <div class="switch-board-list-item-container device-${device.id}">
            <div class="switch-board-list-item-header" onclick="toggleSwitchBoardContent(${device.id})">
                <img src="../static/img/items/smart.switch.png"> ${device.name}
            </div>
            <div class="switch-board-list-item-content removeBtn" id="switch-board-list-item-content-${device.id}" style="display: none;" data-deviceid="${device.id}">
                    Remove
            </div>
        </div>
        `);
    }
    function addAlarmToList(device) {
        console.log("try add alarm", device)
        $(`#alarmList`).append(`
        <div class="switch-board-list-item-container device-${device.id}">
            <div class="switch-board-list-item-header" onclick="toggleSwitchBoardContent(${device.id})">
                <img src="../static/img/items/smart.alarm.png"> ${device.name}
            </div>
            <div class="switch-board-list-item-content removeBtn" id="switch-board-list-item-content-${device.id}" style="display: none;" data-deviceid="${device.id}">
                    Remove
            </div>
        </div>
        `);
    }
    function addMonitorToList(device) {
        console.log("try add monitor", device)
        $(`#monitorList`).append(`
        <div class="switch-board-list-item-container device-${device.id}">
            <div class="switch-board-list-item-header" onclick="toggleSwitchBoardContent(${device.id})">
                <img src="../static/img/items/storage.monitor.png"> ${device.name}
            </div>
            <div class="switch-board-list-item-content removeBtn" id="switch-board-list-item-content-${device.id}" style="display: none;" data-deviceid="${device.id}">
                    Remove
            </div>
        </div>
        `);
    }

    // Function to remove device from the list
    function removeDeviceFromList(device_id) {
        let to_remove = $(`.device-${device_id}`)
        console.log("removing",to_remove)
        to_remove.remove();
    }

    // Submit event for adding device
    $('#addSwitchForm').submit(function (event) {
        event.preventDefault();
        var device_id = $('#switch_id').val();
        var device_name = $('#switch_name').val();
        let device = { id: device_id, name: device_name}
        console.log(device)
        socket.emit('add_switch', device);
        this.reset();
    });

    $('#addAlarmForm').submit(function (event) {
        event.preventDefault();
        var device_id = $('#alarm_id').val();
        var device_name = $('#alarm_name').val();
        let device = { id: device_id, name: device_name}
        console.log(device)
        socket.emit('add_alarm', device);
        this.reset();
    });

    $('#addMonitorForm').submit(function (event) {
        event.preventDefault();
        var device_id = $('#monitor_id').val();
        var device_name = $('#monitor_name').val();
        let device = { id: device_id, name: device_name}
        console.log(device)
        socket.emit('add_monitor', device);
        this.reset();
    });

    // Click event for removing device
    $(document).on('click', '.removeBtn', function () {
        var device_id = $(this).data('deviceid');
        console.log("Removing", device_id)
        socket.emit('remove_device', device_id);
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