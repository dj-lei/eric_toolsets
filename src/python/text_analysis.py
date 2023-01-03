from utils import *
import socket_server
import socketio
import asyncio

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class Response(object):
    def __init__(self, status, msg, data):
        self.status = status
        self.msg = msg
        self.data = data


class TextAnalysisModel(socketio.AsyncNamespace):
    def __init__(self, namespace):
        super().__init__(namespace)
        self.file_container_model = FileContainerModel(self)
        socket_server.sio.register_namespace(self.file_container_model)


class FileContainerModel(socketio.AsyncNamespace):
    def __init__(self, text_analysis_model):
        super().__init__(text_analysis_model.namespace+'/FileContainer')
        self.text_analysis_model = text_analysis_model
        self.text_file_models = {}

    def on_new_file(self, sid, namespace, path):
        self.text_file_models[namespace] = TextFileModel(self, namespace, path)
        socket_server.sio.register_namespace(self.text_file_models[namespace])
        return self.text_file_models[namespace].response()


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

    def response(self):
        return {'fileName':self.file_name, 'namespace': self.namespace, 'path': self.path}

    async def on_search(self, sid, search_atom):
        pass


class TextFileOriginalModel(socketio.AsyncNamespace):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+'/TextFileOriginal')
        self.text_file_model = text_file_model
        self.step = 1
        self.point = 0
        self.range = 10
        self.exp_sign = False
        self.res_lines = []

    async def on_jump(self, sid, point):
        self.point = point - self.step
        await self.on_scroll('')

    async def on_scroll(self, sid):
        # def word_color_replace(word):
        #     return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        self.point = self.point + self.step
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
        super().__init__(text_file_model.namespace+'/TextFileFunction')
        self.text_file_model = text_file_model


class SearchAtomModel(socketio.AsyncNamespace):
    def __init__(self):
        self.desc = ''
        self.exp_search = ''
        self.exp_extract = []
        self.exp_sign = []

    async def on_search(self, sid):
        await self.search()

    def search(self):
        data = 'refresh'
        self.emit('refresh', data, namespace=self.namespace)


class KeyValueTreeModel(object):
    def __init__(self):
        pass

    
class ChartAtomModel(object):
    def __init__(self, parent, desc, exp_search, exp_regex, exp_condition, highlights):
        self.parent = parent
        self.desc = ''
        self.exp_search = None
        self.exp_regex = []
        self.exp_condition = []
        self.highlights = []
        self.retrieval_exp = {}
        self.cmd_words = []

        self.res_search_lines = []
        self.res_kv = {}
        self.res_inverted_index_table = {}
        self.res_condition = {}
        self.res_highlights = {}



