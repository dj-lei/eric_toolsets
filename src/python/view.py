import eventlet
import socketio
import sys
from utils import *
from file import FileContainer
from parallel_shm import Parallel
from engineio.payload import Payload

import multiprocessing

sio = socketio.Server()
app = socketio.WSGIApp(sio)

Payload.max_decode_packets = 500

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.on('new')
def new(sid, params):
    uid = container.new(params['path'], params['handle_type'])
    return {'uid': uid, 'filename':container.files[uid].filename, 'count':len(container.files[uid].lines), 'words':list(container.files[uid].inverted_index_table.keys())}

@sio.on('scroll')
def scroll(sid, params):
    uids = params['uid'].split('/')
    if uids[0] == 'O':
        return {'lines': container.files[uids[1]].scroll(uids[2], int(params['point']), int(params['range']))}
    elif uids[0] == 'S':
        return {'lines': container.files[uids[1]].searchs[uids[2]].scroll(int(params['point']), int(params['range']))}

@sio.on('search')
def search(sid, params):
    file_uid = params['uid'].split('/')[0]
    search_uid = params['uid'].split('/')[1]
    search_uid = container.files[file_uid].search(search_uid, params['desc'], params['exp_search'], params['exp_regex'], params['exp_condition'], params['highlights'])
    return {'uid': search_uid, 'count': len(container.files[file_uid].searchs[search_uid].res_search_lines), 'res_kv': list(container.files[file_uid].searchs[search_uid].res_kv.keys())}

@sio.on('sort')
def sort(sid, params):
    uid, content = container.files[params['uid']].sort(params['key_value_select'])
    return {'uid': uid, 'content': content}

@sio.on('close')
def close(sid, params):
    try:
        return {'status': container.delete(params['uid'])}
    except:
        return {'status': False}

@sio.on("global_sort")
def global_sort(sid, params):
    uid = str(uuid.uuid4()).replace('-','')
    selected_key = {}
    for file in params['global_key_value_select']['children']:
        for searchAtom in file['children']:
            for key in searchAtom['children']:
                if key['check'] == True:
                    data_type = container.files[file['uid']].searchs[searchAtom['uid']].res_kv[key['name']][0]['type']
                    selected_key[file['uid']+'.'+searchAtom['uid']+'.'+data_type+'.'+key['name']] = container.files[file['uid']].searchs[searchAtom['uid']].res_kv[key['name']]
                    for highlight in container.files[file['uid']].searchs[searchAtom['uid']].res_highlights.keys():
                        selected_key[file['uid']+'.'+searchAtom['uid']+'.highlight.'+highlight] = container.files[file['uid']].searchs[searchAtom['uid']].res_highlights[highlight]
    
    final = {}
    for key in selected_key.keys():
        tmp = list(selected_key.keys())
        tmp.remove(key)
        res = pd.DataFrame()
        res = res.append(pd.DataFrame(selected_key[key]))
        res['path'] = key
        for s_key in tmp:
            temp = pd.DataFrame(selected_key[s_key])
            temp['path'] = s_key
            res = res.append(temp).reset_index(drop=True)
        res = res.drop_duplicates(['timestamp'])
        res = res.sort_values('timestamp', ascending=True).reset_index(drop=True)
        res = res.loc[(res['path'] == key)&(res['name'] == key.split('.')[-1]), :].reset_index()
        res = res.rename(columns={"index": "graph_index"})
        res['file_uid'] = key.split('.')[0]
        res['search_uid'] = key.split('.')[1]
        final[key] = json.loads(res.to_json(orient='records'))
    return {'uid': uid, 'content': final}

@sio.on("shutdown_all")
def shutdwon(sid, params):
    print('shutdown all shm and eventlet wsgi!', params)
    container.shutdown()
    proc.close()

@sio.event
def disconnect(sid):
    print('disconnect ', sid)

@sio.on("test")
def test(sid, params):
    pass

if __name__ == '__main__':
    multiprocessing.freeze_support()
    parallel = Parallel()
    container = FileContainer(parallel)
    proc = eventlet.listen(('127.0.0.1', 8000))
    eventlet.wsgi.server(proc, app)