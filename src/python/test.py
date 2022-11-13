import eventlet
import socketio
from utils import *
from file import FileContainer
from engineio.payload import Payload
sio = socketio.Server()
app = socketio.WSGIApp(sio)

Payload.max_decode_packets = 100

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.on('new')
def new(sid, path):
    uid = container.new(path)
    return {'uid': uid, 'filename':container.files[uid].filename, 'lines':container.files[uid].lines, 'words':list(container.files[uid].inverted_index_table.keys())}

@sio.on('scroll')
def scroll(sid, uid, point, range):
    return {'lines': container.files[uid].lines[int(point):int(point)+int(range)]}


@sio.event
def disconnect(sid):
    print('disconnect ', sid)
if __name__ == '__main__':
    container = FileContainer()
    eventlet.wsgi.server(eventlet.listen(('', 8000)), app)