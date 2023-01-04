import socket_server
from aiohttp import web
from text_analysis import TextAnalysisModel

if __name__ == '__main__':
    text_analysis = TextAnalysisModel()
    socket_server.sio.register_namespace(text_analysis)
    web.run_app(socket_server.app, host="127.0.0.1", port=8000)