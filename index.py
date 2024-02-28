import os
import asyncio
from rustplus import RustSocket
from dotenv import load_dotenv
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import sqlite3

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

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

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

@app.route("/")
def index():
    time = asyncio.run(get_time())
    devices = asyncio.run(get_devices())
    return render_template("index.html", time=time, devices=devices, len=len(devices))

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
    emit('response', 'Server received: ' + message)

@socketio.on('request_devices')
def handle_request_devices():
    devices = asyncio.run(get_devices())
    emit('sent_devices', devices)

if __name__ == '__main__':
    app.run(debug=True)
