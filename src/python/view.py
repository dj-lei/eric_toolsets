import warnings
from utils import *
from file import FileContainer
from flask import Flask, jsonify, request
app = Flask(__name__)


@app.after_request
def apply_caching(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,*')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route("/new", methods=['GET'])
def new():
    if request.method == 'GET':
        path = request.args.get('path')

        uid = container.new(path)
        return jsonify({'uid': uid, 'filename':container.files[uid].filename, 'lines':container.files[uid].lines, 'words':list(container.files[uid].inverted_index_table.keys())})
    return jsonify({'content': 'error'})

@app.route("/search", methods=['GET'])
def search():
    if request.method == 'GET':
        file_uid = request.args.get('file_uid')
        search_uid = request.args.get('search_uid')
        desc = request.args.get('desc')
        exp_search = request.args.get('exp_search')
        exp_regex = request.args.getlist('exp_regex[]')
        highlights = json.loads(request.args.get('highlights'))
        if file_uid == '':
            search_uid = container.files[file_uid].search(desc, exp_search, exp_regex, highlights)
        else:
            container.files[file_uid].change(search_uid, desc, exp_search, exp_regex, highlights)
        return jsonify({'uid': search_uid, 'content': container.files[file_uid].searchs[search_uid].res})
    return jsonify({'content': 'error'})

@app.route("/sort", methods=['GET'])
def sort():
    if request.method == 'GET':
        filename = request.args.get('filename')
        key_value_select = json.loads(request.args.get('keyValueSelect'))
        return jsonify({'content': files[filename].sort(key_value_select)})
    return jsonify({'content': 'error'})

@app.route("/global_sort", methods=['GET'])
def global_sort():
    if request.method == 'GET':
        globalKeyValueSelect = json.loads(request.args.get('globalKeyValueSelect'))

        selected_key = {}
        for file in globalKeyValueSelect['children']:
            for searchAtom in file['children']:
                for key in searchAtom['children']:
                    if key['check'] == True:
                        # selected_key[file['name']+'.'+searchAtom['name']+'.'+key['name']] = files[file['uid']].search_atoms[searchAtom['uid']].res['res_kv'][key['name']]
                        data_type = files[file['uid']].search_atoms[searchAtom['uid']].res['res_kv'][key['name']][0]['type']
                        selected_key[file['name']+'.'+searchAtom['name']+'.'+data_type+'.'+key['name']] = files[file['uid']].search_atoms[searchAtom['uid']].res['res_kv'][key['name']]
                for highlight in files[file['uid']].search_atoms[searchAtom['uid']].res['res_highlights'].keys():
                    selected_key[file['name']+'.'+searchAtom['name']+'.highlight.'+highlight] = files[file['uid']].search_atoms[searchAtom['uid']].res['res_highlights'][highlight]
        
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
        return jsonify({'content': json.dumps(final)})
    return jsonify({'content': 'error'})

@app.route("/delete_search", methods=['GET'])
def delete_search():
    pass

@app.route("/upload_template", methods=['GET'])
def upload_template():
    pass

if __name__ == '__main__':
    container = FileContainer()
    app.run(host='0.0.0.0', port=8000)