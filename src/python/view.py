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
    if search_uid == '':
        search_uid = container.files[file_uid].search(params['desc'], params['exp_search'], params['exp_regex'], params['highlights'])
    else:
        container.files[file_uid].change(search_uid, params['desc'], params['exp_search'], params['exp_regex'], params['highlights'])
    return {'uid': search_uid, 'count': len(container.files[file_uid].searchs[search_uid].res_search_lines), 'res_kv': container.files[file_uid].searchs[search_uid].res_kv, 'res_highlights': container.files[file_uid].searchs[search_uid].res_highlights}

@sio.on("sort")
def sort(sid, params):
    return {'content': container.files[params['uid']].sort(params['key_value_select'])}

@sio.on("global_sort")
def global_sort(sid, params):
    selected_key = {}
    for file in params['global_key_value_select']['children']:
        for searchAtom in file['children']:
            for key in searchAtom['children']:
                if key['check'] == True:
                    # selected_key[file['name']+'.'+searchAtom['name']+'.'+key['name']] = files[file['uid']].search_atoms[searchAtom['uid']].res['res_kv'][key['name']]
                    data_type = container.files[file['uid']].searchs[searchAtom['uid']].res_kv[key['name']][0]['type']
                    selected_key[file['name']+'.'+searchAtom['name']+'.'+data_type+'.'+key['name']] = container.files[file['uid']].searchs[searchAtom['uid']].res_kv[key['name']]
            for highlight in container.files[file['uid']].searchs[searchAtom['uid']].res_highlights.keys():
                selected_key[file['name']+'.'+searchAtom['name']+'.highlight.'+highlight] = container.files[file['uid']].searchs[searchAtom['uid']].res_highlights[highlight]
    
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
        final[key] = json.loads(res.to_json(orient='records'))
    return {'content': final}

@sio.event
def disconnect(sid):
    print('disconnect ', sid)
if __name__ == '__main__':
    container = FileContainer()
    eventlet.wsgi.server(eventlet.listen(('127.0.0.1', 8000)), app)