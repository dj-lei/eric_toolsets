from utils import *
import socket_server
import socketio

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']
ns = json_to_object(json.load(open('../config/namespace.json')))
status = json_to_object(json.load(open('../config/status.json')))
msg = json_to_object(json.load(open('../config/msg.json')))

class Response(object):
    def __init__(self, status, msg, model):
        self.status = status
        self.msg = msg
        self.model = model


class TextAnalysisModel(socketio.AsyncNamespace):
    def __init__(self, namespace=ns.TEXTANALYSIS):
        super().__init__(namespace)
        self.file_container_model = FileContainerModel(self)
        socket_server.sio.register_namespace(self.file_container_model)


class FileContainerModel(socketio.AsyncNamespace):
    def __init__(self, text_analysis_model):
        super().__init__(text_analysis_model.namespace+ns.FILECONTAINER)
        self.text_analysis_model = text_analysis_model
        self.text_file_models = {}

    def on_new_file(self, sid, namespace, path):
        self.text_file_models[namespace] = TextFileModel(self, namespace, path)
        socket_server.sio.register_namespace(self.text_file_models[namespace])
        return Response(status.SUCCESS, msg.NONE, self.text_file_models[namespace].model()).__dict__


class TextFileModel(socketio.AsyncNamespace):
    def __init__(self, file_container_model, namespace, path):
        super().__init__(namespace)
        self.file_container_model = file_container_model
        self.path = path
        self.file_name = path.split('\\')[-1]

        with open(self.path, 'r') as f:
            self.lines = f.readlines()
        
        self.text_file_original_model = TextFileOriginalModel(self)
        socket_server.sio.register_namespace(self.text_file_original_model)
        self.text_file_function_model = TextFileFunctionModel(self)
        socket_server.sio.register_namespace(self.text_file_function_model)

    def model(self):
        return {'namespace': self.namespace, 'fileName':self.file_name, 'path': self.path}


class TextFileOriginalModel(socketio.AsyncNamespace):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEORIGINAL)
        self.text_file_model = text_file_model
        self.step = 1
        self.point = 0
        self.range = 60
        self.exp_sign = False
        self.res_lines = []

    async def on_scroll(self, sid, point):
        # def word_color_replace(word):
        #     return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        self.point = point
        self.res_lines = []
        if not self.exp_sign:
            for index, line in enumerate(self.text_file_model.lines[self.point:self.point+self.range]):
                num = str(self.point + index)
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
                self.res_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
        # else:
        #     highlights = pd.DataFrame()
        #     for highlight in self.searchs[uid].res_highlights.keys():
        #         highlights = pd.concat([highlights, pd.DataFrame(self.searchs[uid].res_highlights[highlight])])

        #     for index, line in enumerate(self.lines[point:point+range]):
        #         num = str(point + index)
        #         num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
        #         if len(highlights) > 0:
        #             is_exsit = highlights.loc[(highlights['global_index'] == point + index), :]
        #             if len(is_exsit) > 0:
        #                 lines.append(num+'<td style="color:'+is_exsit['value'].values[0]+';white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
        #                 continue

        #         reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.searchs[uid].cmd_words)+')'+ '['+'|'.join(special_symbols)+']'
        #         lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, line)+'</td>')
        await self.emit('refresh', self.res_lines, namespace=self.namespace)


class TextFileFunctionModel(socketio.AsyncNamespace):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEFUNCTION)
        self.text_file_model = text_file_model

        self.search_function_model = SearchFunctionModel(self)
        socket_server.sio.register_namespace(self.search_function_model)
        self.chart_function_model = ChartFunctionModel(self)
        socket_server.sio.register_namespace(self.chart_function_model)


class SearchFunctionModel(socketio.AsyncNamespace):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.SEARCHFUNCTION)
        self.text_file_function_model = text_file_function_model
        self.search_atom_models = {}
        self.tmp_search_atom_model = None

    def is_register(self, namespace):
        if namespace in self.search_atom_models:
            return True
        else:
            return False

    def register_new_search(self, search_atom_model):
        self.search_atom_models[search_atom_model.namespace] = search_atom_model

    def on_new_search(self, sid, model):
        socket_server.sio.register_namespace(SearchAtomModel(self, json_to_object(model)))
        return Response(status.SUCCESS, msg.NONE, model).__dict__

    def unit_test(self, model):
        self.search_atom_models[model['namespace']] = SearchAtomModel(self, json_to_object(model))
        return self


class ChartFunctionModel(socketio.AsyncNamespace):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.CHARTFUNCTION)
        self.text_file_function_model = text_file_function_model


class SearchAtomModel(socketio.AsyncNamespace):
    def __init__(self, search_function_model, model):
        super().__init__(model.namespace)
        self.search_function_model = search_function_model
        self.alias = ''
        self.desc = ''
        self.exp_search = []
        self.exp_extract = []
        self.exp_sign = []
        self.is_case_sensitive = True

        self.point = 0
        self.range = 15
        self.step = 1
        self.display_lines = []

        self.forward_rows = 0
        self.backward_rows = 0

        self.res_search_units = []
        self.res_key_value = {}
        self.res_sign_coordinate = {}
        self.res_lines = []

    def model(self):
        return {'namespace': self.namespace, 'alias': self.alias, 'desc':self.desc, 'expSearch': self.exp_search, 
        'expExtract': self.exp_extract, 'expSign': self.exp_sign, 'displayLines': self.display_lines}

    async def on_search(self, sid, model):
        self.__dict__.update(model)

        self.search()
        if not self.search_function_model.is_register(self.namespace):
            self.search_function_model.register_new_search(self)
        await self.on_scroll(sid, 0)

    async def on_scroll(self, sid, point):
        self.scroll(point)
        await self.emit('refresh', Response(status.SUCCESS, msg.NONE, self.model()).__dict__, namespace=self.namespace)

    def scroll(self, point):
        self.point = point
        self.display_lines = []
        for index, line in enumerate(self.res_lines[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
            self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+self.search_function_model.text_file_function_model.text_file_model.lines[line]+'</td>')

    def search(self):
        for index, line in enumerate(self.search_function_model.text_file_function_model.text_file_model.lines):
            if self.is_case_sensitive:
                if len(re.findall(self.exp_search, line)) > 0:
                    self.res_search_units.append([index+self.backward_rows, index+self.forward_rows])
            else:
                pass

        self.extract()
        for unit in self.res_search_units:
            self.res_lines.extend(unit)
        self.res_lines = sorted(set(self.res_lines),key=self.res_lines.index)

    def extract(self):
        if len(self.exp_extract) == 0:
            return

        self.res_key_value = {}
        self.res_sign_coordinate = {}
        for search_index, unit in enumerate(self.res_search_units):
            string = '\n'.join(self.search_function_model.text_file_function_model.text_file_model.lines[unit[0]:unit[1]+1])
            ts = ''
            for exp in self.exp_extract:
                r = parse(exp, string)
                if r is not None:
                    ts = r.named['timestamp']
                    for key in r.named.keys():
                        if key == 'timestamp':
                            continue
                        if key not in self.res_key_value:
                            self.res_key_value[key] = []
                        self.res_key_value[key].append({'name': key, 'type': type(r.named[key]).__name__, 'global_index': unit[0]+self.backward_rows, 'search_index': search_index, 'value': r.named[key], 'timestamp': ts})
                    break

            for exp in self.exp_sign:
                if len(re.findall(exp['exp'], string)) > 0:
                    if exp['alias'] not in self.res_sign_coordinate:
                        self.res_sign_coordinate[exp['alias']] = []
                    self.res_sign_coordinate[exp['alias']].append({'name':exp['alias'], 'type': 'sign', 'global_index': unit[0]+self.backward_rows, 'search_index':search_index, 'value': exp['exp'], 'timestamp': ts})

    def unit_test(self, model):
        self.__dict__.update(model)

        self.search()
        self.scroll(self.point)
        return self

    
class ChartAtomModel(socketio.AsyncNamespace):
    def __init__(self, chart_function_model, model):
        super().__init__(model.namespace)
        self.chart_function_model = chart_function_model

        self.alias = ''
        self.width = ''
        self.height = ''
        self.key_value_tree = {}

    async def on_refresh(self, sid):
        await self.emit('refresh', Response(status.SUCCESS, msg.NONE, self.model()).__dict__, namespace=self.namespace)




