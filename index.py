import os
import asyncio
from rustplus import RustSocket
from rustplus import EntityEvent, TeamEvent, ChatEvent
from dotenv import load_dotenv
from flask import Flask, render_template, request
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
rust_socket.connect()

steam_pics = {}

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

def get_steam_profile_pic(steam_id):
    if(steam_id in steam_pics):
        return steam_pics[steam_id]
    url = f'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={SteamApiKey}&steamids={steam_id}'
    try:
        response = requests.get(url)
        data = response.json()
        print(data['response']['players'][0]['avatar'])
        if len(data['response']['players']) > 0:
            profile_pic = data['response']['players'][0]['avatar']
            steam_pics[steam_id] = profile_pic
            return profile_pic
        else:
            return None
    except Exception as e:
        print(f"An error occurred trying to get steam profile pic: {e}")
        return None

async def update_loop():
    await asyncio.sleep(10)
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    while True:
        await asyncio.sleep(1)  # Wait for an amount of time
        try:
            initial_markers = await rust_socket.get_markers()
            markers = []
            for marker in initial_markers:
                steam_id = ""
                if marker.type == 1:
                    steam_id = get_steam_profile_pic(marker.steam_id)
                current_marker = [marker.type, marker.x, marker.y, marker.rotation, steam_id]
                markers.append(current_marker)
            socketio.emit('update_markers', markers)
        except Exception as e:
            print("failed to send markers :-(\n", e)

def start_update_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(update_loop())

update_thread = threading.Thread(target=start_update_loop)
update_thread.daemon = True
update_thread.start()

async def get_map(add_icons=False,add_events=False, add_vending_machines=False):
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    rust_map = await rust_socket.get_map(add_icons=add_icons, add_events=add_events, add_vending_machines=add_vending_machines)
    await rust_socket.disconnect()
    return rust_map

# get a new map png when the program starts
rust_map = asyncio.run(get_map()) 
rust_map.save("static/map.png")

async def get_time():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    rust_time = await rust_socket.get_time()
    await rust_socket.disconnect()
    return rust_time

async def get_devices():
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM tbl_devices")
    devices = cur.fetchall()
    cur.close()
    conn.close()
    return devices

async def get_time():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    time = (await rust_socket.get_time()).time
    await rust_socket.disconnect()
    return time

async def get_server_info():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    info = await rust_socket.get_info()
    await rust_socket.disconnect()
    return info

async def get_markers():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    try:
        await rust_socket.connect()
        markers = await rust_socket.get_markers()
        return markers
    except Exception as e:
        print(f"Error occurred while fetching markers: {e}")
        return []  # Return an empty list in case of error
    finally:
        await rust_socket.disconnect()

@app.route("/")
def index():
    time = asyncio.run(get_time())
    devices = asyncio.run(get_devices())
    info = asyncio.run(get_server_info())
    return render_template("index.html", time=time, devices=devices, len=len(devices), name=info.name)

@app.route("/add_device", methods=["POST"])
def add_device():
    device_id = request.form["device_id"]
    device_name = request.form["device_name"]

    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("INSERT INTO tbl_devices (id, name) VALUES (?, ?)", (device_id, device_name))
    conn.commit()
    cur.close()
    conn.close()

    return "Device added successfully."

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

if __name__ == '__main__':
    socketio.run(app, debug=True, port=18057)