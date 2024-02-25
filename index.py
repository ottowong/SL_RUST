import os
import asyncio
from rustplus import RustSocket
from dotenv import load_dotenv
from flask import Flask, render_template, request
import sqlite3

connection = sqlite3.connect('database.db')
cur = connection.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS tbl_devices (id INTEGER PRIMARY KEY, name TEXT);")

load_dotenv()
ip = os.environ.get("IP")
port = os.environ.get("PORT")
steamId = int(os.environ.get("STEAMID"))
playerToken = int(os.environ.get("PLAYERTOKEN"))

app = Flask(__name__)

async def get_time():
    rust_socket = RustSocket(ip, port, steamId, playerToken)
    await rust_socket.connect()
    time = (await rust_socket.get_time()).time
    await rust_socket.disconnect()
    return time

@app.route("/")
def index():
    time = asyncio.run(get_time())
    return render_template("index.html", time=time)

@app.route("/add_device", methods=["POST"])
def add_device():
    device_id = request.form["device_id"]
    device_name = request.form["device_name"]

    cur.execute("INSERT INTO tbl_devices (id, name) VALUES (?, ?)", (device_id, device_name))
    connection.commit()

    return "Device added successfully."

if __name__ == '__main__':
    app.run(debug=True)
