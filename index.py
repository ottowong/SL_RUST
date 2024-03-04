import os
import asyncio
from rustplus import RustSocket
from rustplus import EntityEvent, TeamEvent, ChatEvent
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
import sqlite3
from PIL import Image, ImageDraw, ImageFont
import threading
import time
import requests
import math

conn = sqlite3.connect('database.db')
cur = conn.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS tbl_devices (id INTEGER PRIMARY KEY, name TEXT, type INTEGER);")
cur.close()
conn.close()

load_dotenv()
ip = os.environ.get("IP")
port = os.environ.get("PORT")
steamId = int(os.environ.get("STEAMID"))
playerToken = int(os.environ.get("PLAYERTOKEN"))
SteamApiKey = os.environ.get("STEAMAPIKEY")

rust_socket = RustSocket(ip, port, steamId, playerToken)

steam_members = {}

server_name=""
server_url=""
server_map=""
server_players=""
server_max_players=""
server_queued=""
server_size=""
server_seed=""

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

def get_steam_member(steam_id):
    if(steam_id in steam_members):
        return steam_members[steam_id]
    url = f'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={SteamApiKey}&steamids={steam_id}'
    try:
        response = requests.get(url)
        data = response.json()
        print(data['response']['players'][0]['avatar'])
        if len(data['response']['players']) > 0:
            profile_pic = data['response']['players'][0]['avatar']
            img_data = requests.get(profile_pic).content
            with open('static/profilepics/'+str(steam_id)+'.jpg', 'wb') as handler:
                handler.write(img_data)
            steam_members[steam_id] = {"url": profile_pic, "is_online": False, "is_alive": True, "steam_id": str(steam_id)}
            return steam_members[steam_id]
        else:
            return None
    except Exception as e:
        print(f"An error occurred trying to get steam profile pic: {e}")
        return None
    
async def get_devices():
        conn = sqlite3.connect('database.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM tbl_devices WHERE type = 1")
        switches = cur.fetchall()
        cur.execute("SELECT id, name FROM tbl_devices WHERE type = 2")
        alarms = cur.fetchall()
        cur.execute("SELECT id, name FROM tbl_devices WHERE type = 3")
        monitors = cur.fetchall()
        cur.close()
        conn.close()
        return switches, alarms, monitors

@app.route("/")
def index():
    switches, alarms, monitors = asyncio.run(get_devices()) # does not ping the API
    return render_template("index.html", switches=switches, len_switches=len(switches), server_name=server_name, ip=ip, port=port, server_url=server_url, server_map=server_map, server_players=server_players, server_max_players=server_max_players, server_queued=server_queued, server_size=server_size, server_seed=server_seed)

@app.route("/add_device", methods=["POST"]) # use sockets for this instead
def add_device():
    device_id = request.form["device_id"]
    device_name = request.form["device_name"]

    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("INSERT INTO tbl_devices (id, name) VALUES (?, ?)", (device_id, device_name))
    conn.commit()
    cur.close()
    conn.close()
    return redirect("/admin")

@app.route("/remove_device", methods=["POST"])
def remove_device():
    device_id = request.form["device_id"]
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("DELETE FROM tbl_devices WHERE id=?", (device_id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect("/admin")

@app.route("/admin")
def admin():
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM tbl_devices")
    devices = cur.fetchall()
    cur.close()
    conn.close()
    return render_template("admin.html", devices=devices, len=len(devices))

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
    
    async def turn_on_device(ID):
        await rust_socket.turn_on_smart_switch(ID)
        return
    
    async def turn_off_device(ID):
        await rust_socket.turn_off_smart_switch(ID)
        return
    
    async def get_markers():
        markers = await rust_socket.get_markers()
        return markers

    async def get_map(add_icons=False,add_events=False, add_vending_machines=False):
        rust_map = await rust_socket.get_map(add_icons=add_icons, add_events=add_events, add_vending_machines=add_vending_machines)
        return rust_map

    async def update_loop(): # updates all markers (player positions & vehicles mainly)
        print("starting update loop...")
        while True:
            await asyncio.sleep(1)  # Wait for an amount of time
            try:
                initial_markers = await rust_socket.get_markers()
                markers = []
                for marker in initial_markers:
                    steam_member = {}
                    if marker.type == 1:
                        steam_member = get_steam_member(marker.steam_id)
                    current_marker = [marker.type, marker.x, marker.y, marker.rotation, steam_member]
                    markers.append(current_marker)
                socketio.emit('update_markers', markers)
            except Exception as e:
                print("failed to send markers :-(\n", e)

    async def medium_loop():
        print("starting medium loop...")
        while True:
            await asyncio.sleep(5)  # Wait for an amount of time
            try:
                team_info = await rust_socket.get_team_info()
                for member in team_info.members:
                    steam_members[member.steam_id]["is_online"] = member.is_online
                    steam_members[member.steam_id]["is_alive"] = member.is_alive

                map_notes = []
                for note in team_info.map_notes:
                    '''
                    RustTeamNote[type=0, x=332.1016845703125, y=1123.61181640625, icon=0, colour_index=0, label=]
                    RustTeamNote[type=1, x=354.3470458984375, y=1194.427490234375, icon=7, colour_index=0, label=BASE]
                    RustTeamNote[type=1, x=2240.386962890625, y=2733.18212890625, icon=1, colour_index=1, label=OUTPOST]
                    '''
                    map_notes.append([note.type,note.x,note.y,note.icon,note.colour_index,note.label])
                socketio.emit('update_notes', map_notes)
            except Exception as e:
                print("failed to update steam members/notes :-(\n", e)

    async def long_loop():
        print("starting long loop...")
        while True:
            await asyncio.sleep(30)  # Wait for an amount of time
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
            except Exception as e:
                print("failed to update server info :-(\n", e)

    async def time_loop(): # get the server time every 10s or something.
        pass


    @socketio.on('message')
    def handle_message(message):
        print('Received message: ' + message)

    @socketio.on('request_devices') # unused
    def handle_request_devices():
        devices = asyncio.run(get_devices())
        emit('sent_devices', devices)

    @socketio.on('turn_on')
    def handle_request_turn_on(ID):
        print("turning on device", ID)
        asyncio.run(turn_on_device(ID))

    @socketio.on('turn_off')
    def handle_request_turn_off(ID):
        print("turning off device", ID)
        asyncio.run(turn_off_device(ID))

    @rust_socket.team_event
    async def team(event : TeamEvent):
        print(f"The team leader's steamId is: {event.team_info.leader_steam_id}")

    @rust_socket.chat_event
    async def chat(event : ChatEvent):
        print(f"{event.message.name}: {event.message.message}")

    # get a new map png when the program starts
    rust_map = await get_map()
    rust_map.save("static/map.png")

    await get_server_info()

    # start the update loop
    asyncio.create_task(update_loop())
    asyncio.create_task(medium_loop())
    asyncio.create_task(long_loop())

    await rust_socket.hang()

def main_thread():
    asyncio.run(Main())

if __name__ == '__main__':
    main_thread = threading.Thread(target=main_thread)
    main_thread.start()
    socketio.run(app, debug=False, port=18057, use_reloader=False)