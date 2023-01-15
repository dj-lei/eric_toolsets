from utils import *
import socket_server
import socketio

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']
ns = json_to_object(json.load(open('../config/namespace.json')))
status = json_to_object(json.load(open('../config/status.json')))
msg = json_to_object(json.load(open('../config/msg.json')))

class PubSub(socketio.AsyncNamespace):
    def __init__(self):
        self.room = {}
        self.wait = {}

    def reference(self, namespace):
        return self.room[namespace]['ins']

    def book(self, namespace, ins, func):
        self.room[namespace] = {'ins': ins, 'subscriber': [], 'action': func}
        if namespace in self.wait:
            for func in self.wait[namespace]:
                self.room[namespace]['subscriber'].append(func)
            del self.wait[namespace]

    def subscribe(self, func, namespace):
        if namespace in self.room:
            self.room[namespace]['subscriber'].append(func)
            return self.room[namespace]['ins']
        else:
            if namespace not in self.wait:
                self.wait[namespace] = []
            self.wait[namespace].append(func)
            return self.reference

    async def publish(self, namespace):
        if namespace in self.room:
            for func in self.room[namespace]['subscriber']:
                await func(namespace)

    async def send_message(self, sid, namespace, origin_namespace, *args):
        if namespace in self.room:
            await self.room[namespace]['action'](sid, namespace, origin_namespace, *args)

pub = PubSub()

class Response(object):
    def __init__(self, status, msg, model):
        self.status = status
        self.msg = msg
        self.model = model


class Model(socketio.AsyncNamespace):
    def __init__(self, namespace):
        super().__init__(namespace)
        socket_server.sio.register_namespace(self)
        pub.book(self.namespace, self, self.action)
        self.subscribes = []

    async def action(self, sid, namespace, origin_namespace, func_name, *args):
        print(namespace.split('/')[-1], origin_namespace.split('/')[-1], func_name)
        func = getattr(self, func_name)
        await func(sid, *args)

    async def new_view_object(self):
        await self.emit('newObject', {'className':self.__class__.__name__.replace('Model', 'View'), 'namespace': self.namespace, 'model': self.model()}, namespace = ns.TEXTANALYSIS)

    async def on_publish(self, sid): #notice subscriber refresh
        print('Publish: ', self.namespace)
        await pub.publish(self.namespace)

    async def on_connected(self, sid, namespace):
        print('Two-way connection established: ', namespace)

    async def on_hidden(self, sid):
        await self.emit('hidden', namespace=self.namespace)

    async def on_display(self, sid):
        await self.emit('display', namespace=self.namespace)

    async def send_message(self, sid, namespace, func_name, *args):
        await pub.send_message(sid, namespace, self.namespace, func_name, *args)

    def subscribe_namespace(self, namespace):
        self.subscribes.append(namespace)
        return pub.subscribe(self.listener, namespace)

    def get_file_container_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:3])

    def get_text_file_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])

    def get_text_file_original_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEORIGINAL

    def get_text_file_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION

    def get_search_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.SEARCHFUNCTION

    def get_chart_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.CHARTFUNCTION

    def get_statistic_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.STATISTICFUNCTION


class TextAnalysisModel(socketio.AsyncNamespace):
    def __init__(self):
        super().__init__(ns.TEXTANALYSIS)
        FileContainerModel(self)


class FileContainerModel(Model):
    def __init__(self, text_analysis_model):
        super().__init__(text_analysis_model.namespace + ns.FILECONTAINER)
        self.text_file_models = {}
        self.active_text_file_model = ''

    async def on_new_file(self, sid, file_paths):
        for path in file_paths:
            new_file_namespace = self.namespace+'/'+createUuid4()
            self.active_text_file_model = new_file_namespace
            
            self.text_file_models[new_file_namespace] = TextFileModel(new_file_namespace, path)
            await self.emit('newFile', self.text_file_models[new_file_namespace].model(), namespace=self.namespace)
            await self.text_file_models[new_file_namespace].new_view_object()

            tmp_text_file_original_model = TextFileOriginalModel(self.text_file_models[new_file_namespace])
            await tmp_text_file_original_model.new_view_object()

            tmp_text_file_function_model = TextFileFunctionModel(self.text_file_models[new_file_namespace])
            await tmp_text_file_function_model.new_view_object()

            tmp_search_function_model = SearchFunctionModel(tmp_text_file_function_model)
            await tmp_search_function_model.new_view_object()
            tmp_chart_function_model = ChartFunctionModel(tmp_text_file_function_model)
            await tmp_chart_function_model.new_view_object()
            tmp_statistic_function_model = StatisticFunctionModel(tmp_text_file_function_model)
            await tmp_statistic_function_model.new_view_object()

    async def on_display_file(self, sid, namespace):
        for text_file_model in self.text_file_models.keys():
            await self.text_file_models[text_file_model].on_hidden(sid)
        self.active_text_file_model = namespace
        await self.text_file_models[namespace].on_display(sid)

    async def on_delete_file(self, sid, namespace):
        await self.text_file_models[namespace].delete()
        
    def on_get_config(self, sid):
        return self.text_file_models[self.active_text_file_model].on_get_config()

    async def on_load_config(self, sid, config):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'search')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)
        await self.text_file_models[self.active_text_file_model].on_load_config(sid, config)
    
    async def on_new_search(self, sid):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'search')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION
        await self.send_message(sid, namespace, 'on_new_search')

    async def on_new_chart(self, sid):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'chart')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION
        await self.send_message(sid, namespace, 'on_new_chart')

    async def on_new_statistic(self, sid):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'statistic')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION
        await self.send_message(sid, namespace, 'on_new_statistic')

    async def on_display_text_file_function(self, sid):
        await self.text_file_models[self.active_text_file_model].on_adjust_view_rate(sid, 0.5)


class TextFileModel(Model):
    def __init__(self, namespace, path):
        super().__init__(namespace)
        self.path = path
        self.file_name = path.split('\\')[-1]
        self.config = {}

        with open(self.path, 'r') as f:
            self.lines = f.readlines()

        self.search_function_model = self.subscribe_namespace(self.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION)
        self.chart_function_model = self.subscribe_namespace(self.namespace + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION)
        self.statistic_function_model = self.subscribe_namespace(self.namespace + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION)

    def model(self):
        return {'namespace': self.namespace, 'fileName':self.file_name, 'path': self.path, 'config': self.config}

    async def listener(self, subscribe_namespace):
        if ('method' in str(type(self.search_function_model))) & (ns.SEARCHFUNCTION in subscribe_namespace):
            self.search_function_model = self.search_function_model(subscribe_namespace)

        if ('method' in str(type(self.chart_function_model))) & (ns.CHARTFUNCTION in subscribe_namespace):
            self.chart_function_model = self.chart_function_model(subscribe_namespace)

        if ('method' in str(type(self.statistic_function_model))) & (ns.STATISTICFUNCTION in subscribe_namespace):
            self.statistic_function_model = self.statistic_function_model(subscribe_namespace)

    async def on_delete(self, sid):
        await self.emit('delete', namespace=self.namespace)
        self.file_container_model.text_file_models[self.namespace] = ''
        del self.file_container_model.text_file_models[self.namespace]
        
    def on_get_config(self):
        self.config['search'] = []
        self.config['chart'] = []
        self.config['statistic'] = []
        self.config['compare_graph'] = []
        if 'method' not in str(type(self.search_function_model)):
            for search_atom_model in self.search_function_model.search_atom_models.keys():
                model = self.search_function_model.search_atom_models[search_atom_model].__dict__
                tmp = {'namespace':model['namespace'].split('/')[-1], 'alias':model['alias'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
                'exp_mark':model['exp_mark'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
                self.config['search'].append(tmp)

        if 'method' not in str(type(self.chart_function_model)):
            for chart_atom_model in self.chart_function_model.chart_atom_models.keys():
                model = self.chart_function_model.chart_atom_models[chart_atom_model].__dict__
                tmp = {'namespace':model['namespace'].split('/')[-1], 'alias':model['alias'], 'key_value_tree': model['key_value_tree']}
                self.config['chart'].append(tmp)

        if 'method' not in str(type(self.statistic_function_model)):
            for statistic_atom_model in self.statistic_function_model.statistic_atom_models.keys():
                model = self.statistic_function_model.statistic_atom_models[statistic_atom_model].__dict__
                tmp = {'namespace':model['namespace'].split('/')[-1], 'alias':model['alias'], 'exp':model['exp']}
                self.config['statistic'].append(tmp)

        return Response(status.SUCCESS, msg.NONE, self.config).__dict__

    async def on_load_config(self, sid, config):
        self.path = config[0]
        self.config = json.loads(config[1])
        search_atom_models = self.config['search']
        await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION, 'on_load_config', search_atom_models)

        chart_atom_models = self.config['chart']
        await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION, 'on_load_config', chart_atom_models)
        
        statistic_atom_models = self.config['statistic']
        await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION, 'on_load_config', statistic_atom_models)
        
    async def on_adjust_view_rate(self, sid, rate):
        await self.send_message(sid, self.get_text_file_original_model_namespace(), 'on_set_height', rate)
        await self.send_message(sid, self.get_text_file_function_model_namespace(), 'on_set_height', 1 - rate)

    async def on_register_compare_graph(self, sid, compare_graph):
        if self.config == {}:
            self.config['compare_graph'] = []
        self.config['compare_graph'].append(compare_graph)

    async def on_display_compare_graph_dialog(self, sid, chart_atom_model):
        await self.emit('displayCompareGraphDialog', chart_atom_model, namespace=self.namespace)


class TextFileOriginalModel(Model):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEORIGINAL)
        self.rateHeight = 1
        self.step = 1
        self.point = 0
        self.range = 60
        self.count =  len(text_file_model.lines)
        self.exp_mark = False
        self.display_lines = []

        self.text_file_model = self.subscribe_namespace(self.get_text_file_model_namespace())
        
    def model(self):
        return {'namespace': self.namespace, 'rateHeight': self.rateHeight, 'point': self.point, 'range': self.range, 'count': self.count, 'displayLines': self.display_lines}

    async def listener(self, subscribe_namespace):
        await self.on_set_height('', 1)
        await self.on_scroll('', 0)

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
        await self.emit('refreshTable', self.model(), namespace=self.namespace)

    async def on_set_height(self, sid, rate):
        self.rateHeight = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)


class TextFileFunctionModel(Model):
    def __init__(self, text_file_model):
        super().__init__(text_file_model.namespace+ns.TEXTFILEFUNCTION)
        self.rateHeight = 0.5

    def model(self):
        return {'namespace': self.namespace, 'rateHeight': self.rateHeight}

    async def on_set_height(self, sid, rate):
        self.rateHeight = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)

    async def on_hidden(self, sid):
        await super().on_hidden(sid)
        await self.send_message(sid, self.get_text_file_model_namespace(), 'on_adjust_view_rate', 1)

    async def on_select_function(self, sid, function):
        await self.on_display(sid)
        if function == 'search':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_display')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_hidden')
        elif function == 'chart':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_display')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_hidden')
        elif function == 'statistic':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_display')
        await self.emit('displayFunction', function, namespace=self.namespace)


class SearchFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.SEARCHFUNCTION)
        self.search_atom_models = {}
        self.tmp_search_atom_model = None
        self.config_count = 0

    def model(self):
        return {}

    async def on_load_config(self, sid, search_atom_models):
        self.config_count = len(search_atom_models)
        for search_atom_model in search_atom_models:
            search_atom_model['namespace'] = self.namespace + search_atom_model['namespace']
            tmp = SearchAtomModel(search_atom_model['namespace'])
            tmp.__dict__.update(search_atom_model)
            await self.emit('newSearch', search_atom_model, namespace=self.namespace)
            await tmp.new_view_object()

    async def register_new_search(self, sid, search_atom_model):
        if search_atom_model.namespace not in self.search_atom_models:
            self.search_atom_models[search_atom_model.namespace] = search_atom_model
            self.tmp_search_atom_model = None

        if self.config_count > 0:
            self.config_count = self.config_count - 1

        if self.config_count == 0:
            await self.on_publish(sid)

    async def on_new_search(self, sid):
        if not self.tmp_search_atom_model:
            await self.send_message(sid, self.get_text_file_function_model_namespace(), 'on_select_function', 'search')
            new_search_namespace = self.namespace+'/'+createUuid4()
            self.tmp_search_atom_model = SearchAtomModel(new_search_namespace)
            await self.emit('newSearch', self.tmp_search_atom_model.model(), namespace=self.namespace)
            await self.tmp_search_atom_model.new_view_object()
        else:
            await self.tmp_search_atom_model.on_display_dialog(sid)

    async def on_delete_search(self, sid, namespace):
        self.search_atom_models[namespace] = ''
        del self.search_atom_models[namespace]

    def unit_test(self, model):
        self.search_atom_models[model['namespace']] = SearchAtomModel(self, json_to_object(model))
        return self


class ChartFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.CHARTFUNCTION)
        self.chart_atom_models = {}
        self.tmp_chart_atom_model = None
        self.config_count = 0

    def model(self):
        return {}

    async def on_load_config(self, sid, chart_atom_models):
        self.config_count = len(chart_atom_models)
        for chart_atom_model in chart_atom_models:
            chart_atom_model['namespace'] = self.namespace + chart_atom_models['namespace']
            tmp = ChartAtomModel(chart_atom_model['namespace'])
            tmp.__dict__.update(chart_atom_model)
            await self.emit('newSearch', chart_atom_model, namespace=self.namespace)
            await tmp.new_view_object()

    async def register_new_chart(self, sid, chart_atom_model):
        if chart_atom_model.namespace not in self.chart_atom_models:
            self.chart_atom_models[chart_atom_model.namespace] = chart_atom_model
            self.tmp_chart_atom_model = None

        if self.config_count > 0:
            self.config_count = self.config_count - 1

        if self.config_count == 0:
            await self.on_publish(sid)

    async def on_new_chart(self, sid):
        if not self.tmp_chart_atom_model:
            await self.send_message(sid, self.get_text_file_function_model_namespace(), 'on_select_function', 'chart')
            new_chart_namespace = self.namespace+'/'+createUuid4()
            self.tmp_chart_atom_model = ChartAtomModel(new_chart_namespace)
            await self.emit('newChart', self.tmp_chart_atom_model.model(), namespace=self.namespace)
            await self.tmp_chart_atom_model.new_view_object()
        else:
            await self.tmp_chart_atom_model.on_display_dialog(sid)

    async def on_delete_chart(self, sid, namespace):
        self.chart_atom_models[namespace] = ''
        del self.chart_atom_models[namespace]


class StatisticFunctionModel(Model):
    def __init__(self, text_file_function_model):
        super().__init__(text_file_function_model.namespace+ns.STATISTICFUNCTION)
        self.statistic_atom_models = {}
        self.tmp_statistic_atom_model = None
        self.config_count = 0
    
    def model(self):
        return {}

    async def on_load_config(self, sid, statistic_atom_models):
        self.config_count = len(statistic_atom_models)
        for statistic_atom_model in statistic_atom_models:
            statistic_atom_model['namespace'] = self.namespace + statistic_atom_model['namespace']
            tmp = StatisticAtomModel(statistic_atom_model['namespace'])
            tmp.__dict__.update(statistic_atom_model)
            await self.emit('newStatistic', statistic_atom_model, namespace=self.namespace)
            await tmp.new_view_object()

    async def register_new_statistic(self, sid, statistic_atom_model):
        if statistic_atom_model.namespace not in self.statistic_atom_models:
            self.statistic_atom_models[statistic_atom_model.namespace] = statistic_atom_model
            self.tmp_statistic_atom_model = None

        if self.config_count > 0:
            self.config_count = self.config_count - 1

        if self.config_count == 0:
            await self.on_publish(sid)

    async def on_new_statistic(self, sid):
        if not self.tmp_statistic_atom_model:
            await self.send_message(sid, self.get_text_file_function_model_namespace(), 'on_select_function', 'statistic')
            new_statistic_namespace = self.namespace+'/'+createUuid4()
            self.tmp_statistic_atom_model = StatisticAtomModel(new_statistic_namespace)
            await self.emit('newStatistic', self.tmp_statistic_atom_model.model(), namespace=self.namespace)
            await self.tmp_statistic_atom_model.new_view_object()
        else:
            await self.tmp_statistic_atom_model.on_display_dialog(sid)

    async def on_delete_statistic(self, sid, namespace):
        self.statistic_atom_models[namespace] = ''
        del self.statistic_atom_models[namespace]


class SearchAtomModel(Model):
    def __init__(self, namespace):
        super().__init__(namespace)

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

        self.text_file_model = self.subscribe_namespace(self.get_text_file_model_namespace())

    def model(self):
        return {'count': self.count, 'namespace': self.namespace, 'alias': self.alias, 'desc':self.desc, 'expSearch': self.exp_search, 
        'expExtract': self.exp_extract, 'expMark': self.exp_mark, 'displayLines': self.display_lines}

    async def listener(self, subscribe_namespace):
        if subscribe_namespace == self.get_text_file_model_namespace():
            self.search()
            await self.on_scroll('', 0)

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_search_function_model_namespace(), 'on_delete_search', self.namespace)

    async def on_search(self, sid, model):
        self.__dict__.update(model)

        self.search()
        await self.send_message(sid, self.get_search_function_model_namespace(), 'register_new_search', self)
        await self.on_scroll(sid, 0)

    async def on_scroll(self, sid, point):
        self.scroll(point)
        await self.emit('refreshTable', self.model(), namespace=self.namespace)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    def scroll(self, point):
        self.point = point
        self.display_lines = []
        for index, line in enumerate(self.res_lines[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
            self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+self.text_file_model.lines[line]+'</td>')

    def search(self):
        self.res_search_units = []

        for index, line in enumerate(self.text_file_model.lines):
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
            string = '\n'.join(self.text_file_model.lines[unit[0]:unit[1]+1])
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
                            self.res_key_value[key] = {'search_alias': self.alias, 'name':key, 'type': type(r.named[key]).__name__, 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                        self.res_key_value[key]['global_index'].append(unit[0]+self.backward_rows)
                        self.res_key_value[key]['search_index'].append(search_index)
                        self.res_key_value[key]['value'].append(r.named[key])
                        self.res_key_value[key]['timestamp'].append(ts)
                    break

            # handle mark
            for exp in self.exp_mark:
                if len(re.findall(exp['exp'], string)) > 0:
                    if exp['alias'] not in self.res_key_value:
                        self.res_key_value[exp['alias']] = {'search_alias': self.alias, 'name':exp['alias'], 'type': 'mark', 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
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
    def __init__(self, namespace):
        super().__init__(namespace)

        self.alias = ''
        self.width = ''
        self.height = ''
        self.key_value_tree = {}
        self.select_lines = {}

        self.text_file_model = self.subscribe_namespace(self.get_text_file_model_namespace())
        self.search_function_model = self.subscribe_namespace(self.get_search_function_model_namespace())

    def model(self):
        if self.key_value_tree == {}:
            self.reload_key_value_tree()
        return {'namespace': self.namespace, 'alias': self.alias, 'keyValueTree': self.key_value_tree, 'selectLines':self.select_lines}

    async def listener(self, subscribe_namespace):
        pass

    def reload_key_value_tree(self):
        self.key_value_tree = {}

        self.key_value_tree = {'namespace': self.text_file_model.namespace.split('/')[-1], 'name': 'Key Value', 'check': False, 'children': []}
        for namespace in self.search_function_model.search_atom_models.keys():
            keys = []
            for key in self.search_function_model.search_atom_models[namespace].res_key_value.__dict__.keys():
                keys.append({'name': key, 'check': False})
            self.key_value_tree['children'].append({'namespace': namespace.split('/')[-1], 'name': self.search_function_model.search_atom_models[namespace].alias, 'check': False, 'children': keys})

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_delete_chart', self.namespace)

    async def on_draw(self, sid, model):
        self.__dict__.update(model)

        selected_key = {}
        for search_atom_model in self.key_value_tree['children']:
            for key in search_atom_model['children']:
                if key['check'] == True:
                    namespace = self.text_file_model.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION + '/' + search_atom_model['namespace']
                    search_alias = self.search_function_model.search_atom_models[namespace].alias
                    key_value = self.search_function_model.search_atom_models[namespace].res_key_value.__dict__[key['name']]
                    if len(key_value.global_index) > 0:
                        selected_key[search_alias+'.'+key['name']] = key_value

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

        await self.send_message(sid, self.get_chart_function_model_namespace(), 'register_new_chart', self)
        await self.emit('refreshChart', self.model(), namespace=self.namespace)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_display_compare_graph_dialog(self, sid):
        await self.chart_function_model.text_file_function_model.text_file_model.on_display_compare_graph_dialog(sid, self)


class StatisticAtomModel(Model):
    def __init__(self, namespace):
        super().__init__(namespace)

        self.alias = ''
        self.exp = ''
        self.exp_optimized = ''
        self.result = ''
        self.type = 'code'

        self.first_graph = []
        self.second_graph = []

        self.search_function_model = self.subscribe_namespace(self.get_search_function_model_namespace())

    def model(self):
        return {'namespace': self.namespace, 'alias': self.alias, 'exp': self.exp, 'result':self.result, 'compareGraph': self.second_graph}

    async def listener(self, subscribe_namespace):
        pass

    async def on_get_compare_graph(self, sid, alias):
        compare_graph = self.statistic_function_model.text_file_function_model.text_file_model.config['compare_graphs']
        self.second_graph = compare_graph[alias]
        search_atom_models = self.statistic_function_model.text_file_function_model.search_function_model.search_atom_models
        for namespace in search_atom_models.keys():
            if search_atom_models[namespace].alias == compare_graph['alias']:
                search_atom_model = search_atom_models[namespace]
                for markindex, marktime in enumerate(search_atom_model.res_key_value.__dict__[compare_graph['mark']].timestamp):
                    for key in compare_graph['key']:
                        key_value = search_atom_model.res_key_value.__dict__[key]
                        for index, timestamp in enumerate(key_value.timestamp):
                            if timestamp in range(marktime - compare_graph['upper_boundary'], marktime + compare_graph['lower_boundary']):
                                 self.first_graph[markindex][key].append(key_value.value[index])

    async def on_statistic(self, sid, model):
        self.__dict__.update(model)

        if self.type == 'code':
            self.code_statistic()
        elif self.type == 'code':
            self.graph_statistic()

        await self.send_message(sid, self.get_statistic_function_model_namespace(), 'register_new_statistic', self)
        await self.emit('refreshTable', self.model(), namespace=self.namespace)

    def code_statistic(self):
        self.exp_optimized = "self.result = " + self.exp
        for search_atom_model in self.search_function_model.search_atom_models.keys():
            ins = self.search_function_model.search_atom_models[search_atom_model].alias + '.'
            if (ins) in self.exp:
                self.exp_optimized = self.exp_optimized.replace(ins, 'self.search_function_model.search_atom_models["'+search_atom_model+'"].res_key_value.')
        exec(self.exp_optimized)

    def graph_statistic(self):
        self.result = []
        for index, _ in enumerate(self.first_graph):
            path, score = lcss_path(self.first_graph[index], self.second_graph[index])
            std1 = np.std(self.first_graph[index])
            std2 = np.std(self.second_graph[index])
            self.result.append(path, score, std1, std2)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)


class InsightAtomModel(Model):
    def __init__(self, namespace):
        super().__init__(namespace)

        self.alias = ''
        self.exp = ''
        self.exp_optimized = ''
        self.result = ''
        self.type = 'code'

        self.first_graph = []
        self.second_graph = []

        self.search_function_model = self.subscribe_namespace(self.get_search_function_model_namespace())

    def model(self):
        return {'namespace': self.namespace, 'alias': self.alias, 'exp': self.exp, 'result':self.result, 'compareGraph': self.second_graph}

    async def listener(self, subscribe_namespace):
        pass

    async def on_Insight(Model):
        #1. 选择Mark之前的时间范围
        #2. 萃取Key value
        #3. 移除Key value后为Mark
        #4. 将KV与历史KV对比, 离散 连续, 拐点, 标准差
            # 1.是否周期性
            # 2. down
            # 3. down pulse
            # 4. up
            # 5. up pulse
        #5. 将mark与历史mark对比, 特殊打印
        #6. 将异常KV,MARK按时间先后绘图, 预测异常kv, mark. root cause
        #7. 可基于条件编辑类型.
        pass
