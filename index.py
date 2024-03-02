import os
import asyncio
from rustplus import RustSocket
from rustplus import EntityEvent, TeamEvent, ChatEvent
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
import sqlite3
from PIL import Image
import threading
import time
import requests

conn = sqlite3.connect('database.db')
cur = conn.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS tbl_devices (id INTEGER PRIMARY KEY, name TEXT);")
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
            steam_members[steam_id] = {"url": profile_pic, "is_online": False, "is_alive": True}
            return steam_members[steam_id]
        else:
            return None
    except Exception as e:
        print(f"An error occurred trying to get steam profile pic: {e}")
        return None

async def Main():
    print("Starting main loop")
    await rust_socket.connect()

    async def get_devices():
        conn = sqlite3.connect('database.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM tbl_devices")
        devices = cur.fetchall()
        cur.close()
        conn.close()
        return devices

    async def get_time():
        time = (await rust_socket.get_time()).time
        return time

    async def get_server_info():
        info = await rust_socket.get_info()
        return info
    
    async def get_markers():
        markers = await rust_socket.get_markers()
        return markers

        
    async def get_map(add_icons=False,add_events=False, add_vending_machines=False):
        rust_map = await rust_socket.get_map(add_icons=add_icons, add_events=add_events, add_vending_machines=add_vending_machines)
        return rust_map


    async def update_loop():
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
            await asyncio.sleep(10)  # Wait for an amount of time
            try:
                data = ""
                team_info = await rust_socket.get_team_info()
                for member in team_info.members:
                    steam_members[member.steam_id]["is_online"] = member.is_online
                    steam_members[member.steam_id]["is_alive"] = member.is_alive
                    # then do coloured circles around the player in the html canvas
            except Exception as e:
                print("failed to send medium update :-(\n", e)

    
    @socketio.on('message')
    def handle_message(message):
        print('Received message: ' + message)

    @socketio.on('request_devices') # unused
    def handle_request_devices():
        devices = asyncio.run(get_devices())
        emit('sent_devices', devices)

    @rust_socket.team_event
    async def team(event : TeamEvent):
        print(f"The team leader's steamId is: {event.team_info.leader_steam_id}")

    @rust_socket.chat_event
    async def chat(event : ChatEvent):
        print(f"{event.message.name}: {event.message.message}")


    @app.route("/")
    def index():
        time = asyncio.run(get_time())
        devices = asyncio.run(get_devices())
        info = asyncio.run(get_server_info())
        return render_template("index.html", time=time, devices=devices, len=len(devices), name=info.name)
    
    @app.route("/admin")
    def admin():
        conn = sqlite3.connect('database.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM tbl_devices")
        devices = cur.fetchall()
        cur.close()
        conn.close()
        return render_template("admin.html", devices=devices, len=len(devices))
        
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

    


    # get a new map png when the program starts
    rust_map = await get_map()
    rust_map.save("static/map.png")

    # start the update loop
    asyncio.create_task(update_loop())
    asyncio.create_task(medium_loop())

    await rust_socket.hang()

def main_thread():
    asyncio.run(Main())

if __name__ == '__main__':
    main_thread = threading.Thread(target=main_thread)
    main_thread.start()
    socketio.run(app, debug=False, port=18057, use_reloader=False)