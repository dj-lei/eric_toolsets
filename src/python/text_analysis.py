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


class Model(socketio.AsyncNamespace):
    def __init__(self, namespace):
        super().__init__(namespace)
        socket_server.sio.register_namespace(self)

    async def on_hidden(self, sid):
        await self.emit('hidden', namespace=self.namespace)

    async def on_display(self, sid):
        await self.emit('display', namespace=self.namespace)


class TextAnalysisModel(socketio.AsyncNamespace):
    def __init__(self, namespace=ns.TEXTANALYSIS):
        super().__init__(namespace)
        self.file_container_model = FileContainerModel(self)


class FileContainerModel(Model):
    def __init__(self, text_analysis_model):
        super().__init__(text_analysis_model.namespace+ns.FILECONTAINER)
        self.text_analysis_model = text_analysis_model
        self.text_file_models = {}
        self.active_text_file_model = ''

    def on_new_file(self, sid, path):
        new_file_namespace = self.namespace+'/'+createUuid4()
        self.active_text_file_model = new_file_namespace
        self.text_file_models[new_file_namespace] = TextFileModel(self, new_file_namespace, path)
        return Response(status.SUCCESS, msg.NONE, self.text_file_models[new_file_namespace].model()).__dict__

    async def on_display_file(self, sid, namespace):
        self.active_text_file_model = namespace
        await self.text_file_models[self.active_text_file_model].hidden()
        await self.text_file_models[namespace].display()

    async def on_delete_file(self, sid, namespace):
        await self.text_file_models[namespace].delete()
        
    def on_get_config(self, sid):
        return self.text_file_models[self.active_text_file_model].get_config()

    async def on_load_config(self, sid, config):
        await self.text_file_models[self.active_text_file_model].load_config(sid, config)
    
    async def on_new_search(self, sid):
        await self.text_file_models[self.active_text_file_model].text_file_function_model.search_function_model.new_search(sid)

    async def on_new_chart(self, sid):
        await self.text_file_models[self.active_text_file_model].text_file_function_model.chart_function_model.new_chart(sid)

    async def on_new_statistic(self, sid):
        await self.text_file_models[self.active_text_file_model].text_file_function_model.statistic_function_model.new_statistic(sid)

    async def on_open_text_file_function(self, sid):
        await self.text_file_models[self.active_text_file_model].on_adjust_view_rate(sid, 0.5)


class TextFileModel(Model):
    def __init__(self, file_container_model, namespace, path):
        super().__init__(namespace)
        self.file_container_model = file_container_model
        self.path = path
        self.file_name = path.split('\\')[-1]
        self.config = {}

        with open(self.path, 'r') as f:
            self.lines = f.readlines()
        
        self.text_file_original_model = TextFileOriginalModel(self)
        self.text_file_function_model = TextFileFunctionModel(self)

    def model(self):
        return {'namespace': self.namespace, 'fileName':self.file_name, 'path': self.path, 'config': self.config}

    async def delete(self):
        await self.emit('delete', namespace=self.namespace)
        self.file_container_model.text_file_models[self.namespace] = ''
        del self.file_container_model.text_file_models[self.namespace]
        
    def get_config(self):
        self.config['search'] = []
        for search_atom_model in self.text_file_function_model.search_function_model.search_atom_models.keys():
            model = self.text_file_function_model.search_function_model.search_atom_models[search_atom_model].__dict__
            tmp = {'namespace':model['namespace'], 'alias':model['alias'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
            'exp_mark':model['exp_mark'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
            self.config['search'].append(tmp)
        return Response(status.SUCCESS, msg.NONE, self.config).__dict__

    async def load_config(self, sid, config):
        self.path = config[0]
        self.config = json.loads(config[1])
        search_atom_models = self.config['search']
        await self.text_file_function_model.search_function_model.load_config(sid, search_atom_models)
        
        return Response(status.SUCCESS, msg.NONE, self.model()).__dict__

    async def on_adjust_view_rate(self, sid, rate):
        await self.text_file_original_model.on_set_height(sid, rate)
        await self.text_file_function_model.on_set_height(sid, 1 - rate)


class TextFileOriginalModel(Model):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEORIGINAL)
        self.text_file_model = text_file_model
        self.rateHeight = 1
        self.step = 1
        self.point = 0
        self.range = 60
        self.count =  len(self.text_file_model.lines)
        self.exp_mark = False
        self.display_lines = []

    def model(self):
        return {'rateHeight': self.rateHeight, 'point': self.point, 'range': self.range, 'count': self.count, 'displayLines': self.display_lines}

    async def on_scroll(self, sid, point):
        # def word_color_replace(word):
        #     return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        self.point = point
        self.display_lines = []
        if not self.exp_mark:
            for index, line in enumerate(self.text_file_model.lines[self.point:self.point+self.range]):
                num = str(self.point + index)
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
                self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
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
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_set_height(self, sid, rate):
        self.rateHeight = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)


class TextFileFunctionModel(Model):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEFUNCTION)
        self.text_file_model = text_file_model
        self.rateHeight = 0.5

        self.search_function_model = SearchFunctionModel(self)
        self.chart_function_model = ChartFunctionModel(self)
        self.statistic_function_model = StatisticFunctionModel(self)

    def model(self):
        return {'rateHeight': self.rateHeight}

    async def on_set_height(self, sid, rate):
        self.rateHeight = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)

    async def on_select_function(self, sid, function):
        if function == 'search':
            await self.search_function_model.on_display(sid)
            await self.chart_function_model.on_hidden(sid)
            await self.statistic_function_model.on_hidden(sid)
        elif function == 'chart':
            await self.search_function_model.on_hidden(sid)
            await self.chart_function_model.on_display(sid)
            await self.statistic_function_model.on_hidden(sid)
        elif function == 'statistic':
            await self.search_function_model.on_hidden(sid)
            await self.chart_function_model.on_hidden(sid)
            await self.statistic_function_model.on_display(sid)

    async def on_hidden(self, sid):
        await self.text_file_model.on_adjust_view_rate(sid, 1)


class SearchFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.SEARCHFUNCTION)
        self.text_file_function_model = text_file_function_model
        self.search_atom_models = {}
        self.tmp_search_atom_model = None

    async def load_config(self, sid, search_atom_models):
        for search_atom_model in search_atom_models:
            search_atom_model_ins = SearchAtomModel(self, search_atom_model['namespace'])
            await self.emit('newSearch', search_atom_model, namespace=self.namespace)
            # await search_atom_model_ins.on_search(sid, search_atom_model)

    def is_register(self, namespace):
        if namespace in self.search_atom_models:
            return True
        else:
            return False

    def register_new_search(self, search_atom_model):
        self.search_atom_models[search_atom_model.namespace] = search_atom_model
        self.tmp_search_atom_model = None

    async def new_search(self, sid):
        if not self.tmp_search_atom_model:
            new_search_namespace = self.namespace+'/'+createUuid4()
            self.tmp_search_atom_model = SearchAtomModel(self, new_search_namespace)
            await self.emit('newSearch', self.tmp_search_atom_model.model(), namespace=self.namespace)
        else:
            await self.tmp_search_atom_model.on_display_dialog()

    def unit_test(self, model):
        self.search_atom_models[model['namespace']] = SearchAtomModel(self, json_to_object(model))
        return self


class ChartFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.CHARTFUNCTION)
        self.text_file_function_model = text_file_function_model
        self.chart_atom_models = {}
        self.tmp_chart_atom_model = None

    def is_register(self, namespace):
        if namespace in self.chart_atom_models:
            return True
        else:
            return False

    def register_new_search(self, chart_atom_model):
        self.chart_atom_models[chart_atom_model.namespace] = chart_atom_model
        self.tmp_chart_atom_model = None

    async def new_chart(self, sid):
        if not self.tmp_chart_atom_model:
            new_chart_namespace = self.namespace+'/'+createUuid4()
            self.tmp_chart_atom_model = ChartAtomModel(self, new_chart_namespace)
            await self.emit('newChart', self.tmp_chart_atom_model.model(), namespace=self.namespace)
        else:
            await self.tmp_chart_atom_model.on_display_dialog()


class StatisticFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.STATISTICFUNCTION)
        self.text_file_function_model = text_file_function_model
        self.statistic_atom_models = {}
        self.tmp_statistic_atom_model = None

    def is_register(self, namespace):
        if namespace in self.statistic_atom_models:
            return True
        else:
            return False

    def register_new_search(self, statistic_atom_model):
        self.chart_atom_models[statistic_atom_model.namespace] = statistic_atom_model
        self.tmp_statistic_atom_model = None

    async def new_statistic(self, sid):
        if not self.tmp_statistic_atom_model:
            new_statistic_namespace = self.namespace+'/'+createUuid4()
            self.tmp_statistic_atom_model = StatisticAtomModel(self, new_statistic_namespace)
            await self.emit('newStatistic', self.tmp_statistic_atom_model.model(), namespace=self.namespace)
        else:
            await self.tmp_statistic_atom_model.on_display_dialog()


class SearchAtomModel(Model):
    def __init__(self, search_function_model, namespace):
        super().__init__(namespace)
        self.search_function_model = search_function_model

        self.alias = ''
        self.desc = ''
        self.exp_search = ''
        self.exp_extract = []
        self.exp_mark = []
        self.is_case_sensitive = True

        self.point = 0
        self.range = 15
        self.step = 1
        self.count = 0
        self.display_lines = []

        self.forward_rows = 0
        self.backward_rows = 0

        self.res_search_units = []
        self.res_key_value = {}
        self.res_lines = []

    def model(self):
        return {'count': self.count, 'namespace': self.namespace, 'alias': self.alias, 'desc':self.desc, 'expSearch': self.exp_search, 
        'expExtract': self.exp_extract, 'expMark': self.exp_mark, 'displayLines': self.display_lines}

    async def on_delete(self, sid):
        self.search_function_model.search_atom_models[self.namespace] = ''
        del self.search_function_model.search_atom_models[self.namespace]

    async def on_search(self, sid, model):
        self.__dict__.update(model)

        self.res_search_units = []
        self.search()
        if not self.search_function_model.is_register(self.namespace):
            self.search_function_model.register_new_search(self)
            await self.search_function_model.text_file_function_model.on_select_function(sid, 'search')
            await self.search_function_model.text_file_function_model.text_file_model.on_adjust_view_rate(sid, 0.5)
        await self.on_scroll(sid, 0)

    async def on_scroll(self, sid, point):
        self.scroll(point)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_display_dialog(self):
        await self.emit('displayDialog', namespace=self.namespace)

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
        self.count = len(self.res_search_units)
        self.res_lines = sorted(set(self.res_lines),key=self.res_lines.index)

    def extract(self):
        if len(self.exp_extract) == 0:
            return

        self.res_key_value = {}
        for search_index, unit in enumerate(self.res_search_units):
            string = '\n'.join(self.search_function_model.text_file_function_model.text_file_model.lines[unit[0]:unit[1]+1])
            ts = ''
            # handle key value
            for exp in self.exp_extract:
                r = parse(exp, string)
                if r is not None:
                    ts = str(r.named['timestamp'])
                    for key in r.named.keys():
                        if key == 'timestamp':
                            continue
                        if key not in self.res_key_value:
                            self.res_key_value[key] = {'name':key, 'type': type(r.named[key]).__name__, 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                        self.res_key_value[key]['global_index'].append(unit[0]+self.backward_rows)
                        self.res_key_value[key]['search_index'].append(search_index)
                        self.res_key_value[key]['value'].append(r.named[key])
                        self.res_key_value[key]['timestamp'].append(ts)
                    break

            # handle mark
            for exp in self.exp_mark:
                if len(re.findall(exp['exp'], string)) > 0:
                    if exp['alias'] not in self.res_key_value:
                        self.res_key_value[exp['alias']] = {'name':exp['alias'], 'type': 'mark', 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                    self.res_key_value[exp['alias']]['global_index'].append(unit[0]+self.backward_rows)
                    self.res_key_value[exp['alias']]['search_index'].append(search_index)
                    self.res_key_value[exp['alias']]['value'].append(exp['color'])
                    self.res_key_value[exp['alias']]['timestamp'].append(ts)
        self.res_key_value = json_to_object(self.res_key_value)

    def unit_test(self, model):
        self.__dict__.update(model)

        self.search()
        self.scroll(self.point)
        return self

    
class ChartAtomModel(Model):
    def __init__(self, chart_function_model, namespace):
        super().__init__(namespace)
        self.chart_function_model = chart_function_model

        self.alias = ''
        self.width = ''
        self.height = ''
        self.key_value_tree = {}
        self.select_lines = {}

    def model(self):
        self.reload_key_value_tree()
        return {'namespace': self.namespace, 'alias': self.alias, 'keyValueTree': self.key_value_tree, 'selectLines':self.select_lines}

    def reload_key_value_tree(self):
        self.key_value_tree = {}
        text_file_model = self.chart_function_model.text_file_function_model.text_file_model
        search_atom_models = self.chart_function_model.text_file_function_model.search_function_model.search_atom_models
        self.key_value_tree = {'uid': text_file_model.namespace, 'name': text_file_model.file_name, 'check': False, 'children': []}
        for namespace in search_atom_models.keys():
            keys = []
            for key in search_atom_models[namespace].res_key_value.__dict__.keys():
                keys.append({'name': key, 'check': False})
            self.key_value_tree['children'].append({'uid': namespace, 'name': search_atom_models[namespace].alias, 'check': False, 'children': keys})

    async def on_draw(self, sid, key_value_tree):
        self.key_value_tree = key_value_tree

        selected_key = {}
        for search_atom_model in self.key_value_tree['children']:
            for key in search_atom_model['children']:
                if key['check'] == True:
                    key_value = self.chart_function_model.text_file_function_model.search_function_model.search_atom_models[search_atom_model['uid']].res_key_value.__dict__[key['name']]
                    if len(key_value.global_index) > 0:
                        selected_key[search_atom_model['uid']+'.'+key['name']] = key_value

        final = {}
        for key in selected_key.keys():
            tmp = list(selected_key.keys())
            tmp.remove(key)
            res = pd.DataFrame()
            res = pd.concat([res, pd.DataFrame(selected_key[key].__dict__)])
            res['full_name'] = key
            for s_key in tmp:
                temp = pd.DataFrame(selected_key[s_key].__dict__)
                temp['full_name'] = s_key
                res = pd.concat([res, temp]).reset_index(drop=True)
            # res['timestamp'] = res.apply(parse_data_format, axis=1)
            res = res.drop_duplicates(['timestamp'])
            res = res.sort_values('timestamp', ascending=True).reset_index(drop=True)
            res = res.loc[(res['full_name'] == key), :].reset_index()
            res = res.rename(columns={"index": "graph_index"})
            res['timestamp'] = res['timestamp'].astype(str)
            # res['file_uid'] = key.split('.')[0]
            # res['search_uid'] = key.split('.')[1]
            final[key] = json.loads(res.to_json(orient='records'))
        self.select_lines = final

        if not self.chart_function_model.is_register(self.namespace):
            self.chart_function_model.register_new_search(self)
            await self.chart_function_model.text_file_function_model.on_select_function(sid, 'chart')
            await self.chart_function_model.text_file_function_model.text_file_model.on_adjust_view_rate(sid, 0.5)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_display_dialog(self):
        await self.emit('displayDialog', namespace=self.namespace)


class StatisticAtomModel(Model):
    def __init__(self, statistic_function_model, namespace):
        super().__init__(namespace)
        self.statistic_function_model = statistic_function_model

        self.alias = ''
        self.exp = ''
        self.exp_optimized = ''
        self.result = ''

    def model(self):
        return {'namespace': self.namespace, 'alias': self.alias, 'exp': self.exp, 'result':self.result}

    async def on_statistic(self, sid, model):
        self.__dict__.update(model)

        search_atom_models = self.statistic_function_model.text_file_function_model.search_function_model.search_atom_models
        self.exp_optimized = "self.result = " + self.exp
        for search_atom_model in search_atom_models.keys():
            ins = search_atom_models[search_atom_model].alias + '.'
            if (ins) in self.exp:
                self.exp_optimized = self.exp_optimized.replace(ins, 'self.statistic_function_model.text_file_function_model.search_function_model.search_atom_models["'+search_atom_model+'"].res_key_value.')
        print(self.exp_optimized)
        exec(self.exp_optimized)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def display_dialog(self):
        await self.emit('displayDialog', namespace=self.namespace)
