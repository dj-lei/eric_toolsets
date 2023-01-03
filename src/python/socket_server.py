from aiohttp import web
import socketio
from engineio.payload import Payload

Payload.max_decode_packets = 40000

sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)