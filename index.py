import os
import asyncio
from rustplus import RustSocket
from dotenv import load_dotenv

load_dotenv()
ip=os.environ.get("IP")
port=os.environ.get("PORT")
steamId=int(os.environ.get("STEAMID"))
playerToken=int(os.environ.get("PLAYERTOKEN"))

async def main():
    socket = RustSocket(ip,port,steamId,playerToken)
    await socket.connect()

    print(f"It is {(await socket.get_time()).time}")

    await socket.disconnect()

asyncio.run(main())