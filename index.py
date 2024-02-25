import os
import asyncio
from rustplus import RustSocket
from dotenv import load_dotenv
from flask import Flask

load_dotenv()
ip=os.environ.get("IP")
port=os.environ.get("PORT")
steamId=int(os.environ.get("STEAMID"))
playerToken=int(os.environ.get("PLAYERTOKEN"))

app = Flask(__name__)

async def main():
    socket = RustSocket(ip,port,steamId,playerToken)
    await socket.connect()

    time = (f"It is {(await socket.get_time()).time}")
    await socket.disconnect()
    return time

@app.route("/")
def hello_world():
    return asyncio.run(main())

if __name__ == '__main__':
    app.run(debug=True)