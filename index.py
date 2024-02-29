import os
import asyncio
from rustplus import RustSocket
from dotenv import load_dotenv
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import sqlite3
from PIL import Image
import threading
import time

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

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

async def emit_markers():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    while True:
        await asyncio.sleep(1)  # Wait for 5 seconds
        try:
            initial_markers = await rust_socket.get_markers()  # This should be awaited
            markers = []
            for marker in initial_markers:
                current_marker = [marker.type, marker.x, marker.y, marker.rotation]
                markers.append(current_marker)
            socketio.emit('update_markers', markers)
        except Exception as e:
            print("failed to send markers :-(\n", e)

def start_emit_markers():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(emit_markers())

marker_thread = threading.Thread(target=start_emit_markers)
marker_thread.daemon = True
marker_thread.start()

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
    devices = asyncio.run(get_devices())
    initial_markers = asyncio.run(get_markers())
    markers = []
    for marker in initial_markers: # implicitly converting the object to json wasnt working, so make a list instead
        current_marker = [marker.type,marker.x,marker.y,marker.rotation]
        print(marker.rotation)
        markers.append(current_marker)
    # emit('update_markers', markers)
    # emit('sent_devices', devices)

@socketio.on('request_devices') # unused
def handle_request_devices():
    devices = asyncio.run(get_devices())
    emit('sent_devices', devices)

if __name__ == '__main__':
    socketio.run(app, debug=True)