import os
import asyncio
from rustplus import RustSocket, EntityEvent, TeamEvent, ChatEvent, CommandOptions, Command
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
import sqlite3
from PIL import Image, ImageDraw, ImageFont
import threading
import time
import requests
import math
import string
import logging
from datetime import timedelta


database_name = "database.db"
conn = sqlite3.connect(database_name)
cur = conn.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS tbl_switches (id INTEGER PRIMARY KEY, name TEXT, status INTEGER)")
cur.execute("CREATE TABLE IF NOT EXISTS tbl_alarms   (id INTEGER PRIMARY KEY, name TEXT)")
cur.execute("CREATE TABLE IF NOT EXISTS tbl_monitors (id INTEGER PRIMARY KEY, name TEXT, combine INTEGER)")
cur.close()
conn.close()

load_dotenv()
ip = os.environ.get("IP")
port = os.environ.get("PORT")
steamId = int(os.environ.get("STEAMID"))
playerToken = int(os.environ.get("PLAYERTOKEN"))
SteamApiKey = os.environ.get("STEAMAPIKEY")

options = CommandOptions(prefix="!")
rust_socket = RustSocket(ip, port, steamId, playerToken, command_options=options)


RUST_SECONDS_PER_MINUTE = 5

team_leader = []
steam_members = {}

message_log = []

monuments = []

server_name=""
server_url=""
server_map=""
server_players=""
server_max_players=""
server_queued=""
server_size=""
server_seed=""

server_time = ""
real_time = ""

server_info = {}

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

# log = logging.getLogger('werkzeug')
# log.setLevel(logging.ERROR)

def get_steam_member(steam_id, update=False):
    if(steam_id in steam_members and not update):
        return steam_members[steam_id]
    url = f'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={SteamApiKey}&steamids={steam_id}'
    try:
        response = requests.get(url)
        data = response.json()
        if len(data['response']['players']) > 0:
            profile_pic = data['response']['players'][0]['avatar']
            state = data['response']['players'][0]['personastate']
            name = data['response']['players'][0]['personaname']
            profile_url = data['response']['players'][0]['profileurl']
            img_data = requests.get(profile_pic).content
            if(steam_id in steam_members):
                steam_members[steam_id]["state"] =  state
            else:
                steam_members[steam_id] = {"url": profile_pic, "is_online": False, "is_alive": True, "steam_id": str(steam_id), "is_leader": False, "state": state, "name": name, "profile_url": profile_url}
                with open('static/profilepics/'+str(steam_id)+'.jpg', 'wb') as handler:
                    handler.write(img_data)
            return steam_members[steam_id]
        else:
            return None
    except Exception as e:
        print(f"An error occurred trying to get steam profile pic: {e}")
        return None
    
async def get_switch(id):
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("SELECT name, status FROM tbl_switches WHERE id = ?", (id,))
    device = cur.fetchone()
    cur.close()
    conn.close()
    return device

async def send_message(message):
    await rust_socket.send_team_message("[SL]: " + message)

async def get_switches():
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("SELECT id, name, status FROM tbl_switches")
    switches = cur.fetchall()
    cur.close()
    conn.close()
    return switches

async def get_monitors():
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM tbl_monitors")
    monitors = cur.fetchall()
    cur.close()
    conn.close()
    return monitors

async def get_alarms():
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("SELECT id, name, description FROM tbl_alarms")
    alarms = cur.fetchall()
    cur.close()
    conn.close()
    return alarms

async def update_switch(id, status):
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("UPDATE tbl_switches SET status = ? WHERE id = ?", (status, id))
    conn.commit()
    cur.close()
    conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/add_device", methods=["POST"]) # use sockets for this instead
def add_device():
    device_id = request.form["device_id"]
    device_name = request.form["device_name"]
    device_type = request.form["device_type"]

    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    print(device_type)
    if(device_type == "1"):
        table = "tbl_switches"
        cur.execute("INSERT INTO tbl_switches (id, name) VALUES (?, ?)", (device_id, device_name))
    elif(device_type == "2"):
        cur.execute("INSERT INTO tbl_alarms (id, name) VALUES (?, ?)", (device_id, device_name))
    elif(device_type == "3"):
        combine = 1 # temporary - add an option in /admin
        cur.execute("INSERT INTO tbl_monitors (id, name, combine) VALUES (?, ?, ?)", (device_id, device_name, combine))
    else:
        return redirect("/admin")
    conn.commit()
    cur.close()
    conn.close()
    return redirect("/admin")

@app.route("/remove_device", methods=["POST"])
def remove_device():
    device_id = request.form["device_id"]
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    # this is probably fine since 2 devices shouldn't have the same id
    cur.execute("DELETE FROM tbl_switches WHERE id=?", (device_id,))
    cur.execute("DELETE FROM tbl_alarms WHERE id=?", (device_id,))
    cur.execute("DELETE FROM tbl_monitors WHERE id=?", (device_id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect("/admin")

@app.route("/admin")
def admin():
    conn = sqlite3.connect(database_name)
    cur = conn.cursor()
    cur.execute("""
    SELECT id, name FROM tbl_switches
    UNION ALL
    SELECT id, name FROM tbl_monitors
    UNION ALL
    SELECT id, name FROM tbl_alarms;
    """)
    devices = cur.fetchall()
    cur.close()
    conn.close()
    return render_template("admin.j2", devices=devices, len=len(devices))

async def Main():
    print("Starting main loop")
    await rust_socket.connect()

    async def get_time():
        time = (await rust_socket.get_time()).time
        return time

    async def get_server_info():
        info = await rust_socket.get_info()
        global server_name,server_url,server_map,server_players,server_max_players,server_queued,server_size,server_seed

        server_name = info.name
        server_url = info.url
        server_map = info.map
        server_players = info.players
        server_max_players = info.max_players
        server_queued = info.queued_players
        server_size = info.size
        server_seed = info.seed
        return info
    
    async def turn_on_switch(id):
        await rust_socket.turn_on_smart_switch(id)
    
    async def turn_off_switch(id):
        await rust_socket.turn_off_smart_switch(id)

    async def toggle_switch(id):
        try:
            device = await get_switch(id)
            if(device[1]==1):
                value = 0
                await turn_off_switch(id)
            elif(device[1]==0):
                await turn_on_switch(id)
                value = 1
            else:
                await turn_on_switch(id)
                value = None
            await update_switch(id, value)
            socketio.emit('update_switch', [id, value])
        except Exception as e:
            socketio.emit('update_switch', [id, None])
            print("sent failed update", e)
            await update_switch(id, None)
    
    async def get_monitor(id):
        try:
            monitor = await rust_socket.get_contents(id, False)

            protection_time = ""
            td = monitor.protection_time
            print(td)
            if(td >= timedelta()):
                days = td.days
                hours, remainder = divmod(td.seconds, 3600)
                minutes, seconds = divmod(remainder, 60)
                if days > 0:
                    protection_time += f"{days} Days, "
                if hours > 0:
                    protection_time += f"{hours} Hours, "
                if minutes > 0:
                    protection_time += f"{minutes} Minutes, "
                if seconds > 0:
                    protection_time += f"{seconds} Seconds"
                # Remove trailing comma and space if there is one
                if protection_time.endswith(", "):
                    protection_time = protection_time[:-2]
            print(monitor.has_protection)
            has_protection = monitor.has_protection

            items = []
            temp_combined = {}
            combined_items = []
            for item in monitor.contents:
                item_id = item.item_id
                name = item.name
                quantity = item.quantity
                is_blueprint = item.is_blueprint
                items.append([item_id, name, quantity, is_blueprint])
                # make a total list
                if(item_id in temp_combined):
                    temp_combined[item_id]['quantity'] += quantity
                else:
                    temp_combined[item_id] = {'name': name, 'quantity': quantity, 'is_blueprint': is_blueprint}
            for item_id, details in temp_combined.items():
                combined_items.append([item_id, details['name'], details['quantity'], details['is_blueprint']])
            monitor_dict = {
                "id": id,
                "items": items,
                "combined_items": combined_items,
                "has_protection": has_protection,
                "protection_time": protection_time
            }
            return monitor_dict
        except Exception as e:
            print("Monitor not found", e)
            return None # monitor not found

    async def get_map(add_icons=False,add_events=False, add_vending_machines=False):
        rust_map = await rust_socket.get_map(add_icons=add_icons, add_events=add_events, add_vending_machines=add_vending_machines)
        map_data = await rust_socket.get_raw_map_data()
        monuments.clear()
        for monument in map_data.monuments:
            newtext = monument.token.replace("_"," ").replace("display name","").replace("monument name","").replace("monument","")
            newtext = string.capwords(newtext)
            newtext = newtext.replace("Abandonedmilitarybase","Abandoned Military Base")
            newtext = newtext.replace("Launchsite","Launch Site")
            newtext = newtext.replace("Hqm","HQM")
            monuments.append([newtext,monument.x,monument.y])
        return rust_map
    
    async def get_entity_info(id):
        try:
            info = await rust_socket.get_entity_info(id)
            return info
        except Exception:
            # if the entity doesnt exist
            return None
        
    # LOOPS

    async def update_loop(): # updates all markers (player positions & vehicles mainly)
        print("starting update loop...")
        while True:
            try:
                initial_markers = await rust_socket.get_markers()
                markers = []
                for marker in initial_markers:
                    steam_member = {}
                    if marker.type == 1:
                        steam_member = get_steam_member(marker.steam_id) # for profile pics on player markers
                    current_marker = [marker.type, marker.x, marker.y, marker.rotation, steam_member]
                    markers.append(current_marker)
                socketio.emit('update_markers', markers)
            except Exception as e:
                print("failed to send markers :-(\n", e)
            await asyncio.sleep(1)  # Wait for an amount of time

    async def medium_loop():
        print("starting medium loop...")
        while True:
            try:
                team_info = await rust_socket.get_team_info()
                for member in team_info.members:
                    get_steam_member(member.steam_id, True) # for updating notes
                    steam_members[member.steam_id]["is_online"] = member.is_online
                    steam_members[member.steam_id]["is_alive"] = member.is_alive
                    steam_members[member.steam_id]["is_leader"] = (member.steam_id==team_info.leader_steam_id)
                map_notes = []
                for note in team_info.map_notes:
                    map_notes.append([note.type,note.x,note.y,note.icon,note.colour_index,note.label,0])
                for note in team_info.leader_map_notes:
                    map_notes.append([note.type,note.x,note.y,note.icon,note.colour_index,note.label,1])
                socketio.emit('update_notes', map_notes)
                socketio.emit('update_steam_members', steam_members)
            except Exception as e:
                print("failed to update steam members/notes :-(\n", e)
            await asyncio.sleep(3)  # Wait for an amount of time

    async def long_loop():
        print("starting long loop...")
        global server_info
        while True:
            try:
                info = await get_server_info()
                server_info = {
                    "url" : info.url,
                    "name" : info.name,
                    "map" : info.map,
                    "size" : info.size,
                    "players" : info.players,
                    "max_players" : info.max_players,
                    "queued_players" : info.queued_players,
                    "seed" : info.seed
                }
                # {'url': '', 'name': 'SADLADS TEST SERVER', 'map': 'Procedural Map', 'size': 4500, 'players': 1, 'max_players': 500, 'queued_players': 0, 'seed': 1337}                
                socketio.emit('update_server_info', server_info)
                await update_time() # update the time so that we stay on track
            except Exception as e:
                print("failed to update server info :-(\n", e)
            await asyncio.sleep(30)  # Wait for an amount of time

    async def switch_loop(): # checks all switches
        print("starting switch loop...")
        while True:
            switches = await get_switches()
            for device in switches:
                try:
                    device_info = await get_entity_info(device[0])
                    if(not device_info):
                        value = None
                    else:
                        value = device_info.value
                    if(device[2] != value):
                        print("switch database mismatch! updating...")
                        await update_switch(device[0], value)
                        socketio.emit('update_switch', [device[0], value])
                except Exception as e:
                    print(f"Request error occurred: {e}")
                await asyncio.sleep(4)
            await asyncio.sleep(1)

    async def monitor_loop():
        while True:
            monitors = await get_monitors()
            for monitor in monitors:
                monitor_id = monitor[0]
                monitor_name = monitor[1]
                monitor_info = await get_monitor(monitor_id)
                print(monitor_name)
                print(monitor_info)
                print()
                socketio.emit("update_monitor", monitor_info)
                await asyncio.sleep(4)
            await asyncio.sleep(1)

    async def time_loop(): # get the server time every 10s or something.
        while True:
            guessedtime = await get_in_game_time()
            socketio.emit('update_time', guessedtime)
            await asyncio.sleep(RUST_SECONDS_PER_MINUTE) # send every time a minute occurs

    # on first connection
    @socketio.on('message')
    def handle_message(message):
        print('Received message: ' + message)
        switches = asyncio.run(get_switches())
        emit("monuments", monuments)
        emit("sent_switches", switches) # this should be sent more than once
        emit("update_server_info", server_info)

    @socketio.on('send_message')
    def handle_send_message(message):
        asyncio.run(send_message(message))

    @socketio.on('toggle')
    def handle_request_turn_on(id):
        print("toggling device", id)
        asyncio.run(toggle_switch(id))

    @rust_socket.team_event
    async def team(event : TeamEvent):
        print(f"The team leader's steamId is: {event.team_info.leader_steam_id}")

    @rust_socket.chat_event
    async def chat(event : ChatEvent):
        print(f"{event.message.name}: {event.message.message}")
        socketio.emit('chat_message', [event.message.name, event.message.message])
        message_log.append([event.message.name, event.message.message])
        if (len(message_log)  > 50):
            message_log.pop(0)

    @rust_socket.command
    async def toggle(command : Command):
        print("toggling", command.args)
        conn = sqlite3.connect(database_name)
        cur = conn.cursor()
        successes = 0
        for switch in command.args:
            try:
                cur.execute("SELECT id, status FROM tbl_switches WHERE name like ?", (switch,))
                device = cur.fetchone()
                print(device)
                await toggle_switch(device[0])
                successes += 1
            except Exception:
                print("failed")
        cur.close()
        conn.close()

    async def update_time():
        global server_time
        global real_time
        server_time = await get_time()
        real_time = time.time()

    async def get_in_game_time():
        # Do some shitty maths to figure out what the time is
        current_real_time = time.time()
        elapsed_real_time_seconds = current_real_time - real_time

        hours_str, minutes_str = server_time.split(":")        
        hours = int(hours_str)
        minutes = int(minutes_str)

        # add the starting time to the elapsed time, convert irl time to rust time
        elapsed_rust_time_seconds = ((minutes) + (hours * 60) + (elapsed_real_time_seconds / RUST_SECONDS_PER_MINUTE)) * 60

        rust_hours = int((elapsed_rust_time_seconds % 86400) // 3600)
        rust_minutes = int((elapsed_rust_time_seconds % 3600) // 60)

        rust_time = "{:02d}:{:02d}".format(rust_hours, rust_minutes)

        return rust_time

    # get a new map png when the program starts
    rust_map = await get_map()
    rust_map.save("static/map.png")

    await get_server_info()
    await update_time()
    

    # start the update loop
    asyncio.create_task(update_loop())
    asyncio.create_task(medium_loop())
    asyncio.create_task(long_loop())
    asyncio.create_task(switch_loop())
    asyncio.create_task(time_loop())
    asyncio.create_task(monitor_loop())

    

    await rust_socket.hang()

def main_thread():
    asyncio.run(Main())

if __name__ == '__main__':
    main_thread = threading.Thread(target=main_thread)
    main_thread.start()
    socketio.run(app, debug=False, port=18057, use_reloader=False)