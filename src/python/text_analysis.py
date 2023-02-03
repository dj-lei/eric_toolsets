from utils import *

from special import take_apart_dcgm
import socket_server
import socketio

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']
ns = json_to_object(json.load(open('../config/namespace.json')))
status = json_to_object(json.load(open('../config/status.json')))
msg = json_to_object(json.load(open('../config/msg.json')))


class PubSub(socketio.AsyncNamespace):
    # Publish Subscribe System, two way
    # 1.Changed inform parent and children
    # 2.Declarative subscription
    def __init__(self):
        self.room = {}

    def book(self, namespace, ins, func):
        self.room[namespace] = {'ins': ins, 'subscriber': [], 'action': func}

    def subscribe(self, func, namespace):
        self.room[namespace]['subscriber'].append(func)
        return self.room[namespace]['ins']

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


class AsyncObject(object):
    async def __new__(cls, *a, **kw):
        instance = super().__new__(cls)
        await instance.__init__(*a, **kw)
        return instance

    async def __init__(self):
        pass


class Model(socketio.AsyncNamespace, AsyncObject):
    async def __init__(self, namespace, mode):
        if mode == 'normal':
            super().__init__(namespace)
            socket_server.sio.register_namespace(self)
        else:
            self.namespace = namespace

        pub.book(self.namespace, self, self.action)
        self.mode = mode
        self.sid = ''
        self.subscribes = []
            
    async def action(self, sid, namespace, origin_namespace, func_name, *args):
        print(namespace.split('/')[-1], origin_namespace.split('/')[-1], func_name)
        func = getattr(self, func_name)
        await func(sid, *args)

    async def publish(self, namespace): #notice subscriber refresh
        await self.parent.listener(namespace)
        await pub.publish(self.namespace)

    async def new_view_object(self):
        if self.mode == 'normal':
            await self.emit('newObject', {'className':self.__class__.__name__.replace('Model', 'View'), 'namespace': self.namespace, 'model': self.model()}, namespace = ns.TEXTANALYSIS)

    async def on_connected(self, sid, namespace):
        self.sid = sid
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

    def get_text_analysis_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:2])

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

    def get_insight_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.INSIGHTFUNCTION

    def get_chart_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.CHARTFUNCTION

    def get_statistic_function_model_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.STATISTICFUNCTION

    async def isBatchAble(self, namespace):
        pass


class Fellow(Model):
    async def __init__(self, namespace, mode):
        await super().__init__(namespace, mode)
        self.models = {}
        self.config_count = 0
        self.connected_count = 0
        self.is_load_config = False
        self.model_name = self.__class__.__name__.replace('Function', 'Atom')
        self.class_name = getattr(sys.modules[__name__], self.model_name)

        self.text_analysis_model = self.subscribe_namespace(self.get_text_analysis_model_namespace())

    def model(self):
        return {}

    async def listener(self, publish_namespace):
        pass

    async def on_load_config(self, sid, models):
        self.connected_count = 0
        self.config_count = len(models)
        self.is_load_config = True
        for model in models:
            model['namespace'] = self.namespace + '/' + model['alias']
            if self.mode == 'normal':
                await self.emit('new', model, namespace=self.namespace)
                self.models[model['namespace']] = await self.class_name(self, model)
                # func = getattr(self.models[model['namespace']], 'on_'+self.__class__.__name__.split('Function')[0].lower())
                # await func(sid, model)
            else:
                self.models[model['namespace']] = await self.class_name(self, model, self.mode)
                # func = getattr(self.models[model['namespace']], self.__class__.__name__.split('Function')[0].lower())
                # func()
            await self.send_message(sid, self.get_text_analysis_model_namespace(), 'on_register_alias_data', self.models[model['namespace']])

    async def on_new(self, sid, model):
        new_namespace = self.namespace+'/'+model['alias']
        model['namespace'] = new_namespace
        await self.emit('new', model, namespace=self.namespace)
        self.models[new_namespace] = await self.class_name(self, model)
        func = getattr(self.models[model['namespace']], 'on_'+self.__class__.__name__.split('Function')[0].lower())
        await func(sid, model)
        await self.send_message(sid, self.get_text_analysis_model_namespace(), 'on_register_alias_data', self.models[new_namespace])

    async def on_delete(self, sid, namespace):
        await self.send_message(sid, self.get_text_analysis_model_namespace(), 'on_logout_alias_data', self.models[namespace])
        self.models[namespace] = ''
        del self.models[namespace]
    
    async def on_delete_all(self, sid):
        ns = set(list(self.models.keys()))
        for namespace in ns:
            await self.on_delete(sid, namespace)

    async def isPublishAble(self, namespace): #notice subscriber refresh
        if self.config_count > 0:
            self.config_count = self.config_count - 1

        if self.config_count == 0:
            await super().publish(namespace)

    async def isBatchAble(self, namespace):
        if self.is_load_config:
            self.connected_count = self.connected_count + 1
            if self.connected_count >= self.config_count:
                print('----------')
                self.text_analysis_model.parallel.parallel(self.models)
                # for namespace in self.models.keys():
                #     if self.mode == 'normal':
                #         await self.models[namespace].on_refresh('')
                #     else:
                #         func = getattr(self.models[namespace], self.__class__.__name__.split('Function')[0].lower())
                #         func()
                self.is_load_config = False
                self.connected_count = 0


class TextAnalysisModel(Model):
    async def __init__(self, parallel, mode='normal'):
        await super().__init__(ns.TEXTANALYSIS, mode)
        self.alias_data = {}
        self.parallel = parallel
        self.file_container_model = await FileContainerModel(self, self.mode)

    async def listener(self, publish_namespace):
        pass

    async def on_register_alias_data(self, sid, ref):
        self.alias_data[ref.alias] = ref

    async def on_logout_alias_data(self, sid, ref):
        self.alias_data[ref.alias] = ''
        del self.alias_data[ref.alias]


class FileContainerModel(Model):
    async def __init__(self, text_analysis_model, mode='normal'):
        await super().__init__(text_analysis_model.namespace + ns.FILECONTAINER, mode)
        self.parent = text_analysis_model

        self.text_file_models = {}
        self.active_text_file_model = ''

        self.batch_insight_model = await BatchInsightModel(self, self.mode)
        self.batch_statistic_model = await BatchStatisticModel(self, self.mode)

    async def listener(self, publish_namespace):
        await self.publish(publish_namespace)

    async def on_new_file(self, sid, file_paths):
        for path in file_paths:
            new_file_namespace = self.namespace+'/'+path.split('\\')[-1]
            
            self.text_file_models[new_file_namespace] = await TextFileModel(self, new_file_namespace, path)
            await self.emit('newFile', self.text_file_models[new_file_namespace].model(), namespace=self.namespace)
            await self.on_display_file(sid, new_file_namespace)

    async def on_delete_file(self, sid, namespace):
        await self.text_file_models[namespace].on_delete(sid)
        
    def on_get_config(self, sid):
        return self.text_file_models[self.active_text_file_model].on_get_config()

    async def on_load_config(self, sid, config):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'search')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)
        await self.text_file_models[self.active_text_file_model].on_load_config(sid, config)

    async def on_new_search(self, sid, model):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'search')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION
        await self.send_message(sid, namespace, 'on_new', model)

    async def on_new_insight(self, sid, model):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'insight')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.INSIGHTFUNCTION
        await self.send_message(sid, namespace, 'on_new', model)

    async def on_new_chart(self, sid, model):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'chart')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION
        await self.send_message(sid, namespace, 'on_new', model)

    async def on_new_statistic(self, sid, model):
        await self.send_message(sid, self.active_text_file_model + ns.TEXTFILEFUNCTION, 'on_select_function', 'statistic')
        await self.send_message(sid, self.active_text_file_model, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file_model + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION
        await self.send_message(sid, namespace, 'on_new', model)

    async def on_display_file(self, sid, namespace):
        params = {'earlierActiveTextFileModel': self.active_text_file_model, 'activeTextFileModel': ''}
        for text_file_model in self.text_file_models.keys():
            await self.text_file_models[text_file_model].on_hidden(sid)
        self.active_text_file_model = namespace

        await self.text_file_models[namespace].on_display(sid)
        params['activeTextFileModel'] = self.active_text_file_model
        await self.emit('displayFile', params, namespace=self.namespace)

    async def on_display_text_file_function(self, sid):
        await self.text_file_models[self.active_text_file_model].text_file_function_model.on_display(sid)

    async def on_display_tmp_search_atom_dialog(self, sid):
        await self.text_file_models[self.active_text_file_model].on_display_tmp_search_atom_dialog(sid)

    async def on_display_tmp_insight_atom_dialog(self, sid):
        await self.text_file_models[self.active_text_file_model].on_display_tmp_insight_atom_dialog(sid)

    async def on_display_tmp_chart_atom_svg_dialog(self, sid):
        await self.text_file_models[self.active_text_file_model].on_display_tmp_chart_atom_svg_dialog(sid)

    async def on_display_tmp_statistic_atom_dialog(self, sid):
        await self.text_file_models[self.active_text_file_model].on_display_tmp_statistic_atom_dialog(sid)

    async def on_display_batch_insight(self, sid):
        await self.batch_insight_model.on_display_dialog(sid)

    async def on_display_batch_statistic(self, sid):
        await self.batch_statistic_model.on_display_dialog(sid)

    async def on_display_batch_insight_view(self, sid):
        await self.batch_insight_model.on_display_table_dialog(sid)

    async def on_display_batch_statistic_view(self, sid):
        await self.batch_statistic_model.on_display_table_dialog(sid)
    
    def on_dcgm_analysis(self, sid, params):
        print('Dcgm Analysis!', params)
        try:
            take_apart_dcgm(params['dcgm_dir'] + '\\', params['save_dir'] + '\\', params['telog_filter'], params['elog_filter'])
            return Response(status.SUCCESS, msg.NONE, '').__dict__
        except Exception as e:
            return Response(status.ERROR, str(e), '').__dict__


class TextFileModel(Model):
    async def __init__(self, file_container_model, namespace, path, mode='normal'):
        await super().__init__(namespace, mode)
        self.parent = file_container_model

        self.path = path
        self.file_name = path.split('\\')[-1]
        self.config = {}

        with open(self.path, 'r') as f:
            self.lines = f.readlines()
            # self.lines = self.parent.parent.parallel.copy_to_shm(self.namespace, f.readlines())

        await self.new_view_object()
        self.text_file_original_model = await TextFileOriginalModel(self, mode)
        self.text_file_function_model = await TextFileFunctionModel(self, mode)

        if self.mode == 'normal':
            self.tmp_search_atom_model = await SearchAtomModel(self, {'namespace': self.namespace + ns.TMPSEARCHATOMMODEL})
            self.tmp_insight_atom_model = await InsightAtomModel(self, {'namespace': self.namespace + ns.TMPINSIGHATOMMODEL})
            self.tmp_chart_atom_model = await ChartAtomModel(self, {'namespace': self.namespace + ns.TMPCHARTATOMMODEL})
            self.tmp_statistic_atom_model = await StatisticAtomModel(self, {'namespace': self.namespace + ns.TMPSTATISTICATOMMODEL})

    def model(self):
        return {'namespace': self.namespace, 'fileName':self.file_name, 'path': self.path, 'config': self.config}

    async def listener(self, publish_namespace):
        # if 'SearchFunction' in publish_namespace:
        #     pass

        await self.publish(publish_namespace)

    async def on_delete(self, sid):
        self.lines = ''
        await self.text_file_function_model.search_function_model.on_delete_all(sid)
        await self.text_file_function_model.insight_function_model.on_delete_all(sid)
        await self.text_file_function_model.chart_function_model.on_delete_all(sid)
        await self.text_file_function_model.statistic_function_model.on_delete_all(sid)

        if self.mode == 'normal':
            self.parent.text_file_models[self.namespace] = ''
            await self.emit('delete', namespace=self.namespace)
            await socket_server.sio.disconnect(self.sid, namespace = self.namespace)
            del socket_server.sio.namespace_handlers[self.namespace]
            del self.parent.text_file_models[self.namespace]
        
    def on_get_config(self):
        self.config['search'] = []
        self.config['insight'] = []
        self.config['chart'] = []
        self.config['statistic'] = []

        for search_atom_model in self.text_file_function_model.search_function_model.models.keys():
            model = self.text_file_function_model.search_function_model.models[search_atom_model].__dict__
            tmp = {'alias':model['alias'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
            'exp_mark':model['exp_mark'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
            self.config['search'].append(tmp)

        for insight_atom_model in self.text_file_function_model.insight_function_model.models.keys():
            model = self.text_file_function_model.insight_function_model.models[insight_atom_model].__dict__
            tmp = {'alias':model['alias'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
            'exp_mark':model['exp_mark'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
            self.config['insight'].append(tmp)

        for chart_atom_model in self.text_file_function_model.chart_function_model.models.keys():
            model = self.text_file_function_model.chart_function_model.models[chart_atom_model].__dict__
            tmp = {'alias':model['alias'], 'key_value_tree': model['key_value_tree']}
            self.config['chart'].append(tmp)

        for statistic_atom_model in self.text_file_function_model.statistic_function_model.models.keys():
            model = self.text_file_function_model.statistic_function_model.models[statistic_atom_model].__dict__
            tmp = {'alias':model['alias'], 'exp':model['exp']}
            self.config['statistic'].append(tmp)

        return Response(status.SUCCESS, msg.NONE, self.config).__dict__

    async def on_load_config(self, sid, config, load=['search', 'insight', 'chart', 'statistic']):
        print(config[0])
        self.path = config[0]
        self.config = json.loads(config[1])
        if 'search' in load:
            search_atom_models = self.config['search']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION, 'on_load_config', search_atom_models)

        if 'insight' in load:
            insight_atom_models = self.config['insight']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.INSIGHTFUNCTION, 'on_load_config', insight_atom_models)

        if 'chart' in load:
            chart_atom_models = self.config['chart']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION, 'on_load_config', chart_atom_models)
        
        if 'statistic' in load:
            statistic_atom_models = self.config['statistic']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION, 'on_load_config', statistic_atom_models)
        
    async def on_adjust_view_rate(self, sid, rate):
        await self.send_message(sid, self.get_text_file_original_model_namespace(), 'on_set_height', rate)
        await self.send_message(sid, self.get_text_file_function_model_namespace(), 'on_set_height', 1 - rate)

    async def on_display_tmp_search_atom_dialog(self, sid):
        await self.tmp_search_atom_model.on_display_dialog(sid)

    async def on_display_tmp_insight_atom_dialog(self, sid):
        await self.tmp_insight_atom_model.on_display_dialog(sid)

    async def on_display_tmp_chart_atom_svg_dialog(self, sid):
        await self.tmp_chart_atom_model.on_display_dialog(sid)

    async def on_display_tmp_statistic_atom_dialog(self, sid):
        await self.tmp_statistic_atom_model.on_display_dialog(sid)


class TextFileOriginalModel(Model):
    async def __init__(self, text_file_model, mode='normal'):
        await super().__init__(text_file_model.namespace+ns.TEXTFILEORIGINAL, mode)
        self.parent = text_file_model
        self.rateHeight = 1
        self.step = 1
        self.point = 0
        self.range = 60
        self.count =  len(text_file_model.lines)
        self.exp_mark = False
        self.display_lines = []

        await self.new_view_object()
        
    def model(self):
        return {'namespace': self.namespace, 'rateHeight': self.rateHeight, 'point': self.point, 'range': self.range, 'count': self.count, 'displayLines': self.display_lines}

    async def listener(self, publish_namespace):
        await self.on_set_height('', 1)
        await self.on_scroll('', 0)

    async def on_scroll(self, sid, point):
        # def word_color_replace(word):
        #     return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        if point in [1, -1]:
            self.point = self.point + point
        else:
            self.point = point
        self.display_lines = []
        if not self.exp_mark:
            for index, line in enumerate(self.parent.lines[self.point:self.point+self.range]):
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
    async def __init__(self, text_file_model, mode='normal'):
        await super().__init__(text_file_model.namespace+ns.TEXTFILEFUNCTION, mode)
        self.parent = text_file_model
        self.rateHeight = 0.5

        await self.new_view_object()
        self.search_function_model = await SearchFunctionModel(self, mode)
        self.insight_function_model = await InsightFunctionModel(self, mode)
        self.chart_function_model = await ChartFunctionModel(self, mode)
        self.statistic_function_model = await StatisticFunctionModel(self, mode)

    def model(self):
        return {'namespace': self.namespace, 'rateHeight': self.rateHeight}

    async def listener(self, publish_namespace):
        await self.publish(publish_namespace)

    async def on_set_height(self, sid, rate):
        self.rateHeight = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)

    async def on_display(self, sid):
        await super().on_display(sid)
        await self.send_message(sid, self.get_text_file_model_namespace(), 'on_adjust_view_rate', 0.5)

    async def on_hidden(self, sid):
        await super().on_hidden(sid)
        await self.send_message(sid, self.get_text_file_model_namespace(), 'on_adjust_view_rate', 1)

    async def on_select_function(self, sid, function):
        await self.on_display(sid)
        if function == 'search':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_display')
            await self.send_message(sid, self.get_insight_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_hidden')
        elif function == 'insight':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_model_namespace(), 'on_display')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_hidden')
        elif function == 'chart':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_display')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_hidden')
        elif function == 'statistic':
            await self.send_message(sid, self.get_search_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_display')
        await self.emit('displayFunction', function, namespace=self.namespace)


class SearchFunctionModel(Fellow):
    async def __init__(self, text_file_function_model, mode='normal'):
        await super().__init__(text_file_function_model.namespace+ns.SEARCHFUNCTION, mode)
        self.parent = text_file_function_model
        await self.new_view_object()


class InsightFunctionModel(Fellow):
    async def __init__(self, text_file_function_model, mode='normal'):
        await super().__init__(text_file_function_model.namespace+ns.INSIGHTFUNCTION, mode)
        self.parent = text_file_function_model
        await self.new_view_object()


class ChartFunctionModel(Fellow):
    async def __init__(self, text_file_function_model, mode='normal'):
        await super().__init__(text_file_function_model.namespace+ns.CHARTFUNCTION, mode)
        self.parent = text_file_function_model
        await self.new_view_object()


class StatisticFunctionModel(Fellow):
    async def __init__(self, text_file_function_model, mode='normal'):
        await super().__init__(text_file_function_model.namespace+ns.STATISTICFUNCTION, mode)
        self.parent = text_file_function_model
        await self.new_view_object()


class SearchAtomModel(Model):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

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
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'count': self.count, 'namespace': self.namespace, 'alias': self.alias, 'desc':self.desc, 'expSearch': self.exp_search, 
        'expExtract': self.exp_extract, 'expMark': self.exp_mark, 'displayLines': self.display_lines}

    async def listener(self, publish_namespace):
        pass
        # if publish_namespace == self.text_file_model.namespace:
        #     self.search()
        #     await self.on_scroll('', 0)

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        await self.parent.isBatchAble(self.namespace)

    async def on_refresh(self, sid):
        await self.emit('display', namespace=self.namespace)
        await self.emit('startLoader', namespace=self.namespace)
        self.search()
        await self.parent.isPublishAble(self.namespace)
        await self.on_scroll(sid, 0)
        await self.emit('stopLoader', namespace=self.namespace)

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_search_function_model_namespace(), 'on_delete', self.namespace)

    async def on_search(self, sid, model, mode='new'):
        self.__dict__.update(model)

        if mode == 'new':
            await self.on_refresh(sid)
        else:
            await self.send_message(sid, self.get_file_container_model_namespace(), 'on_new_search', model)

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
                    ts = r.named['timestamp']
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


class InsightAtomModel(Model):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.alias = ''
        self.desc = ''
        self.exp_search = ''
        self.exp_extract = ''
        self.exp_mark = ''
        self.is_case_sensitive = True

        self.forward_rows = 0
        self.backward_rows = 0

        self.forward_range = 60
        self.backward_range = 2
        self.number = 0

        self.point = 0
        self.range = 15
        self.step = 1
        self.count = 0
        self.display_lines = []

        self.res_search_units = []
        self.res_key_value = {}
        self.res_lines = []
        self.res_mark = {}
        self.res_residue_marks = []

        self.compare_graphs = [
            {'abnormal_type': 'AbnormalUpPulse', 'value': [0,1,0], 'similarity': 0.7, 'inflection_point':0, 'outlier':1, 'return_point':2},
            {'abnormal_type': 'AbnormalDownPulse', 'value': [1,0,1], 'similarity': 0.7, 'inflection_point':0, 'outlier':1, 'return_point':2},
            {'abnormal_type': 'AbnormalUp', 'value': [0,0,1,1], 'similarity': 0.75, 'inflection_point':1, 'outlier':2},
            {'abnormal_type': 'AbnormalDown', 'value': [1,1,0,0], 'similarity': 0.75, 'inflection_point':1, 'outlier':2}
        ]
        self.scale_max = 100

        self.text_file_model = self.subscribe_namespace(self.get_text_file_model_namespace())
        self.outlier = []
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'count': self.count, 'namespace': self.namespace, 'alias': self.alias, 'desc':self.desc, 'expSearch': self.exp_search, 
        'expExtract': self.exp_extract, 'expMark': self.exp_mark, 'displayLines': self.display_lines}

    async def listener(self, publish_namespace):
        pass

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        await self.parent.isBatchAble(self.namespace)

    async def on_refresh(self, sid):
        await self.parent.isPublishAble(self.namespace)
        await self.on_scroll(sid, 0)

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_insight_function_model_namespace(), 'on_delete', self.namespace)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_insight(self, sid, model, mode='new'):
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
        
        self.__dict__.update(model)
        if mode == 'new':
            self.insight()
            await self.on_refresh(sid)
        else:
            await self.send_message(sid, self.get_file_container_model_namespace(), 'on_new_insight', model)

    async def on_scroll(self, sid, point):
        self.scroll(point)
        await self.emit('refreshTable', self.model(), namespace=self.namespace)

    def scroll(self, point):
        self.point = point
        self.display_lines = []
        for index, outlier in enumerate(self.outlier[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
            self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+outlier['timestamp']+' '+outlier['type']+' '+outlier['desc']+'</td>')

    def insight(self):
        self.search()

        timestamp = ''
        forward_time = ''
        backward_time = ''
        select_mark = {}
        if len(self.res_mark.keys()) > 0:
            for mark in self.res_mark.keys():
                timestamp = dp(self.res_mark[mark]['timestamp'][self.number])
                forward_time = timestamp - timedelta(seconds=self.forward_range)
                backward_time = timestamp + timedelta(seconds=self.backward_range)
                select_mark = {'name': 'mark', 'type': 'manual', 'abnormal_type': 'ManualSelect', 'global_index':self.res_mark[mark]['global_index'][self.number], 
                    'search_index':self.res_mark[mark]['search_index'][self.number], 'timestamp':self.res_mark[mark]['timestamp'][self.number], 
                    'value':self.res_mark[mark]['value'][self.number], 'desc':self.res_mark[mark]['name']}

            res_residue_marks = pd.DataFrame(self.res_residue_marks)
            indices = get_points_in_time_range(str(forward_time), str(backward_time), list(res_residue_marks.timestamp.values))
            self.outlier.extend(self.judge_mark_outlier(res_residue_marks, indices))

            for key in self.res_key_value.keys():
                if (len(self.res_key_value[key]['global_index']) > 0):
                    indices = get_points_in_time_range(str(forward_time), str(backward_time), self.res_key_value[key]['timestamp'])
                    # print(key, self.res_key_value[key]['type'], indices)
                    if (self.res_key_value[key]['type'] == 'str'):
                        outlier = self.judge_discrete_key_value_outlier(pd.DataFrame(self.res_key_value[key]), indices)
                    else:
                        outlier = self.judge_consecutive_key_value_outlier(pd.DataFrame(self.res_key_value[key]), indices)
                    self.outlier.extend(outlier)
            # outlier sort 
            self.outlier = pd.DataFrame(self.outlier)
            self.outlier = self.outlier.sort_values('timestamp', ascending=True).reset_index(drop=True)
            self.outlier =  json.loads(self.outlier.to_json(orient='records'))
            self.outlier.append(select_mark)
            self.count = len(self.outlier)

    def search(self):
        self.res_search_units = []

        for index, line in enumerate(self.text_file_model.lines):
            if self.is_case_sensitive:
                if len(re.findall(self.exp_search, line)) > 0:
                    self.res_search_units.append([index+self.backward_rows, index+self.forward_rows])
            else:
                pass

        self.fuzzy_extract()
        for unit in self.res_search_units:
            self.res_lines.extend(unit)
        self.count = len(self.res_search_units)
        self.res_lines = sorted(set(self.res_lines),key=self.res_lines.index)

    def fuzzy_extract(self):
        def self_clean_special_symbols(text, symbol):
            for ch in ['::', '/','*','{','}','[',']','(',')','#','+','!',';',',','"','\'','>','<','@','`','$','^','&','|','\n']:
                if ch in text:
                    text = text.replace(ch,symbol)
            return re.sub(symbol+"+", symbol, text)

        def key_value_replace(word):
            return ''

        regex = '([A-Za-z0-9_.]+?)[ ]?[:=][ ]?(.*?) '
        if len(self.exp_extract) == '':
            return

        for search_index, unit in enumerate(self.res_search_units):
            string = '\n'.join(self.text_file_model.lines[unit[0]:unit[1]+1])
            ts = ''
            # handle key value
            r = parse(self.exp_extract, string)
            if r is not None:
                ts = str(r.named['timestamp'])
                msg = r.named['msg']
                msg = self_clean_special_symbols(msg, ' ')
                for key, value in re.findall(regex, msg):
                    if is_float(value):
                        value = float(value)
                        if (value == float('inf')) | (value == float('-inf')):
                            continue
                    elif is_int(value):
                        value = int(value)

                    if key+'_'+type(value).__name__ not in self.res_key_value:
                        self.res_key_value[key+'_'+type(value).__name__] = {'insight_alias': self.alias, 'name':key, 'type': type(value).__name__, 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                    self.res_key_value[key+'_'+type(value).__name__]['global_index'].append(unit[0]+self.backward_rows)
                    self.res_key_value[key+'_'+type(value).__name__]['search_index'].append(search_index)
                    self.res_key_value[key+'_'+type(value).__name__]['value'].append(value)
                    self.res_key_value[key+'_'+type(value).__name__]['timestamp'].append(ts)
                residue_mark = re.sub(regex, key_value_replace, msg)
                self.res_residue_marks.append({'global_index':unit[0]+self.backward_rows, 'search_index':search_index, 'value':residue_mark, 'timestamp':ts})

            # handle mark
            if len(re.findall(self.exp_mark['exp'], string)) > 0:
                if self.exp_mark['alias'] not in self.res_mark:
                    self.res_mark[self.exp_mark['alias']] = {'insight_alias': self.alias, 'name':self.exp_mark['exp'], 'type': 'mark', 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                self.res_mark[self.exp_mark['alias']]['global_index'].append(unit[0]+self.backward_rows)
                self.res_mark[self.exp_mark['alias']]['search_index'].append(search_index)
                self.res_mark[self.exp_mark['alias']]['value'].append(self.exp_mark['color'])
                self.res_mark[self.exp_mark['alias']]['timestamp'].append(ts)

    def judge_mark_outlier(self, key_value, indices):
        res = []
        if len(indices) > 0:
            history = key_value.loc[0: indices[0], :]
            history = history.drop_duplicates(['value'])
            history = history.sort_values('timestamp', ascending=True).reset_index(drop=True)

            near = key_value.loc[indices, :]
            near = near.drop_duplicates(['value'])
            near = near.sort_values('timestamp', ascending=True).reset_index(drop=True)

            histories = history.value.values

            for index, near_value in enumerate(near.value.values):
                if near_value not in histories:
                    res.append({'name': 'mark', 'type': 'mark', 'abnormal_type': 'UniquePrint', 'global_index':near['global_index'][index], 
                    'search_index':near['search_index'][index], 'timestamp':near['timestamp'][index], 
                    'value':near_value, 'desc':near_value})
         
        return res

    def judge_discrete_key_value_outlier(self, key_value, indices):
        history_change = []
        near_change = []
        res = []

        if len(indices) > 0:
            history = key_value.loc[0:indices[0], :]
            cur_status = history['value'][0]
            for stat in history.value.values:
                if stat != cur_status:
                    history_change.append([cur_status, stat])

            near = key_value.loc[indices, :].reset_index(drop=True)
            near_change_indices = []
            cur_status = history['value'].values[-1]
            for index, stat in enumerate(near.value.values):
                if stat != cur_status:
                    near_change.append([cur_status, stat])
                    near_change_indices.append(index)
                    cur_status = stat

            for index, change in enumerate(near_change):
                if change not in history_change:
                    # print(index, change)
                    res.append({'name':near['name'][0], 'type': 'str', 'abnormal_type': 'Mutation', 'global_index':near['global_index'][near_change_indices[index]], 
                    'search_index':near['search_index'][near_change_indices[index]], 'timestamp':near['timestamp'][near_change_indices[index]], 
                    'value':near['value'][near_change_indices[index]], 'desc': near['name'][0] + ':  ' + change[0] + ' --> ' + change[1]})
        
        return res

    def judge_consecutive_key_value_outlier(self, key_value, indices):
        res = []

        if len(indices) > 0:
            near = key_value.loc[indices, :].reset_index(drop=True)

            # judege is Periodic 
            # if true return
            for graph in self.compare_graphs:
                a = minmax_scale(list(near.value.values), feature_range=(0, self.scale_max))
                b = minmax_scale(graph['value'], feature_range=(0, self.scale_max))
                path, score = lcss_path(a, b)
                if (score >= graph['similarity']) & (len(near.value.values) > len(graph['value'])):
                    # print(graph['abnormal_type'], path, score)
                    # print(near)
                    if 'Pulse' in graph['abnormal_type']:
                        res.append({'name':near['name'][0], 'type': key_value['type'][0], 'abnormal_type': graph['abnormal_type'], 'global_index':near['global_index'][path[graph['outlier']][0]], 
                        'search_index':near['search_index'][path[graph['outlier']][0]], 'timestamp':near['timestamp'][path[graph['outlier']][0]], 
                        'value':near['value'][path[graph['outlier']][0]], 'desc':near['name'][0] + ':  ' + str(near['value'][path[graph['inflection_point']][0]]) + ' --> ' + str(near['value'][path[graph['outlier']][0]]) + ' --> ' + str(near['value'][path[graph['return_point']][0]])})
                    else:
                        res.append({'name':near['name'][0], 'type': key_value['type'][0], 'abnormal_type': graph['abnormal_type'], 'global_index':near['global_index'][path[graph['outlier']][0]], 
                        'search_index':near['search_index'][path[graph['outlier']][0]], 'timestamp':near['timestamp'][path[graph['outlier']][0]], 
                        'value':near['value'][path[graph['outlier']][0]], 'desc':near['name'][0] + ':  ' + str(near['value'][path[graph['inflection_point']][0]]) + ' --> ' + str(near['value'][path[graph['outlier']][0]])})
                break
        return res

    
class ChartAtomModel(Model):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.alias = ''
        self.desc = ''
        self.width = ''
        self.height = ''
        self.key_value_tree = {}
        self.select_lines = {}

        self.search_function_model = self.subscribe_namespace(self.get_search_function_model_namespace())
        self.text_file_model = self.search_function_model.parent.parent
        
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        if self.key_value_tree == {}:
            self.generate_key_value_tree()
        return {'namespace': self.namespace, 'alias': self.alias, 'desc': self.desc, 'keyValueTree': self.key_value_tree, 'selectLines':self.select_lines}

    async def listener(self, publish_namespace):
        if publish_namespace == self.search_function_model.namespace:
            self.generate_key_value_tree()
            await self.on_update_dialog('')

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        await self.parent.isBatchAble(self.namespace)

    async def on_refresh(self, sid):
        await self.parent.isPublishAble(self.namespace)
        await self.emit('refreshChart', self.model(), namespace=self.namespace)

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_chart_function_model_namespace(), 'on_delete', self.namespace)

    async def on_chart(self, sid, model, mode='new'):
        self.__dict__.update(model)

        if mode == 'new':
            self.chart()
            await self.on_refresh(sid)
        else:
            await self.send_message(sid, self.get_file_container_model_namespace(), 'on_new_chart', model)

    async def on_click_event(self, sid, params):
        await self.send_message(sid, self.get_text_file_original_model_namespace(), 'on_scroll', params['data']['globalIndex'])

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_update_dialog(self, sid):
        await self.emit('updateDialog', self.model(), namespace=self.namespace)

    async def on_clear_key_value_tree(self, sid):
        self.alias = ''
        self.desc = ''
        self.generate_key_value_tree()
        await self.on_update_dialog(sid)

    def chart(self):
        selected_key = {}
        for search_atom_model in self.key_value_tree['children']:
            for key in search_atom_model['children']:
                if key['check'] == True:
                    namespace = self.text_file_model.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION + '/' + search_atom_model['namespace']
                    search_alias = self.search_function_model.models[namespace].alias
                    key_value = self.search_function_model.models[namespace].res_key_value[key['name']]
                    if len(key_value['global_index']) > 0:
                        selected_key[search_alias+'.'+key['name']] = key_value

        final = {}
        for key in selected_key.keys():
            tmp = list(selected_key.keys())
            tmp.remove(key)
            res = pd.DataFrame()
            res = pd.concat([res, pd.DataFrame(selected_key[key])])
            res['full_name'] = key
            for s_key in tmp:
                temp = pd.DataFrame(selected_key[s_key])
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

    def generate_key_value_tree(self):
        self.key_value_tree = {}

        self.key_value_tree = {'namespace': self.text_file_model.namespace.split('/')[-1], 'name': 'Key Value', 'check': False, 'children': []}
        for namespace in self.search_function_model.models.keys():
            keys = []
            for key in self.search_function_model.models[namespace].res_key_value.keys():
                keys.append({'name': key, 'check': False})
            self.key_value_tree['children'].append({'namespace': namespace.split('/')[-1], 'name': self.search_function_model.models[namespace].alias, 'check': False, 'children': keys})

    def reload_key_value_tree(self):
        tmp_key_value_tree = {'namespace': self.text_file_model.namespace.split('/')[-1], 'name': 'Key Value', 'check': False, 'children': []}
        for namespace in self.search_function_model.models.keys():
            keys = []
            for key in self.search_function_model.models[namespace].res_key_value.__dict__.keys():
                keys.append({'name': key, 'check': False})
            tmp_key_value_tree['children'].append({'namespace': namespace.split('/')[-1], 'name': self.search_function_model.models[namespace].alias, 'check': False, 'children': keys})

        diff = DeepDiff(self.key_value_tree, tmp_key_value_tree)
        print(diff)
        if 'dictionary_item_added' in diff:
            for item in diff['dictionary_item_added']:
                l = item.replace('root', 'self.key_value_tree')
                r = item.replace('root', 'tmp_key_value_tree')
                exec(l+" = "+r)
        elif 'dictionary_item_removed' in diff:
            for item in diff['dictionary_item_removed']:
                l = item.replace('root', 'self.key_value_tree')
                exec("del "+l)


class StatisticAtomModel(Model):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.alias = ''
        self.desc = ''
        self.code = ''

        self.statistic_type = 'code'
        self.result = ''
        self.result_type = ''

        self.search_function_model = self.subscribe_namespace(self.get_search_function_model_namespace())
        self.text_analysis_model = self.subscribe_namespace(self.get_text_analysis_model_namespace())
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'namespace': self.namespace, 'alias': self.alias, 'desc': self.desc, 'code': self.code, 'result':str(self.result), 'resultType':str(self.result_type)}

    async def listener(self, publish_namespace):
        pass

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        await self.parent.isBatchAble(self.namespace)

    async def on_refresh(self, sid):
        await self.parent.isPublishAble(self.namespace)
        await self.emit('refreshTextarea', self.model(), namespace=self.namespace)

    async def on_delete(self, sid):
        await self.send_message(sid, self.get_statistic_function_model_namespace(), 'on_delete', self.namespace)

    async def on_statistic(self, sid, model, mode='new'):
        self.__dict__.update(model)

        if mode == 'new':
            self.statistic()
            await self.on_refresh(sid)
        else:
            await self.send_message(sid, self.get_file_container_model_namespace(), 'on_new_statistic', model)

    async def on_statistic_test(self, sid, model):
        self.__dict__.update(model)

        self.statistic()
        await self.emit('refreshTest', self.model(), namespace=self.namespace)

    def statistic(self):
        if self.statistic_type == 'code':
            self.code_statistic()
        elif self.statistic_type == 'graph':
            self.graph_statistic()

    def code_statistic(self):
        try:
            exec(self.code)
        except Exception as e:
            self.result = str(e)
            self.result_type = "error"
        self.result_type = type(self.result)

    def graph_statistic(self):
        self.result = []
        for index, _ in enumerate(self.first_graph):
            path, score = lcss_path(self.first_graph[index], self.second_graph[index])
            std1 = np.std(self.first_graph[index])
            std2 = np.std(self.second_graph[index])
            self.result.append(path, score, std1, std2)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)


class BatchInsightModel(Model):
    async def __init__(self, file_container_model, mode='normal'):
        await super().__init__(file_container_model.namespace + ns.BATCHINSIGHT, mode)
        self.parent = file_container_model
        self.cluster_num = 2
        self.batch_insight = {}
        self.samples = {}
        self.labels = {}
        self.cluster_tree = {}
        self.result = pd.DataFrame()

    def model(self):
        return {'clusterNum': self.cluster_num, 'clusterTree': self.cluster_tree }

    def preprocess(self, atom):
        outlier = pd.DataFrame(atom.outlier)
        mark_outlier = outlier.loc[(outlier['abnormal_type'] == 'UniquePrint'), :]
        mark_outlier = mark_outlier.drop_duplicates(['value']).reset_index(drop=True)
        mark_outlier['value'] = atom.alias + '_' + mark_outlier['value']

        discrete_outlier = outlier.loc[(outlier['abnormal_type'] == 'mutation'), :]
        discrete_outlier = discrete_outlier.sort_values('timestamp', ascending=False).reset_index(drop=True)
        discrete_outlier = discrete_outlier.drop_duplicates(['name']).reset_index(drop=True)
        discrete_outlier['value'] = discrete_outlier['name'] + '_' + discrete_outlier['value']
        discrete_outlier['value'] = atom.alias + '_' + discrete_outlier['value']

        consecutive_outlier = outlier.loc[(outlier['type'] == 'float'), :]
        consecutive_outlier = pd.concat([consecutive_outlier, outlier.loc[(outlier['type'] == 'int'), :]]).reset_index(drop=True)
        consecutive_outlier['value'] = consecutive_outlier['name'] + '_' + consecutive_outlier['abnormal_type']
        consecutive_outlier['value'] = atom.alias + '_' + consecutive_outlier['value']

        features = list(mark_outlier['value'].values)
        features.extend(list(discrete_outlier['value'].values))
        features.extend(list(consecutive_outlier['value'].values))
        return features

    async def on_new(self, sid, dir_path, config):
        await self.new(dir_path, config)

    async def on_refresh(self, sid, sample):
        await self.emit('refresh', sample, namespace=self.namespace)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_display_table_dialog(self, sid):
        await self.emit('displayTableDialog', namespace=self.namespace)

    async def on_get_universal(self, sid, cluster_num):
        return self.universal(cluster_num)

    async def on_get_single_insight(self, sid, file_namespace):
        insight_function_model = self.batch_insight[file_namespace]['insight_function_model']
        sample = {}
        for insight_namespace in insight_function_model.models.keys():
            atom = insight_function_model.models[insight_namespace]
            if len(atom.outlier) == 0:
                continue
            sample[atom.alias] = atom.outlier
        return sample

    async def new(self, dir_path, config):
        self.dir_path = dir_path
        self.config_path = config
        self.config = json.dumps(json.load(open(config)))
        self.samples = pd.DataFrame()
        self.result = pd.DataFrame()

        for path in iterate_files_in_directory(self.dir_path):
            new_file_namespace = self.parent.namespace+'/'+path.split('\\')[-1]
            
            tmp_file = await TextFileModel(self.parent, new_file_namespace, self.dir_path+'\\'+path, 'batch')
            await tmp_file.on_load_config('', [self.dir_path+'\\'+path, self.config], ['insight'])
            sample = self.insight(tmp_file)
            if self.mode == 'normal':
                await self.on_refresh('', sample)
            await tmp_file.on_delete('')
            print('Finish :', tmp_file.file_name)
        self.cluster()

    def insight(self, text_file_model):
        insight_function_model = text_file_model.text_file_function_model.insight_function_model
        item = []
        sample = {'filePath':text_file_model.path, 'configPath':self.config_path, 'fileName': text_file_model.file_name}
        for insight_namespace in insight_function_model.models.keys():
            atom = insight_function_model.models[insight_namespace]
            if len(atom.outlier) == 0:
                continue

            features = self.preprocess(atom)
            sample[atom.alias] = atom.outlier
            item.extend(features)
        item = pd.DataFrame([[1 for _ in range(0, len(item))]], columns=item)
        self.samples = pd.concat([self.samples, item]).reset_index(drop=True)
        self.result = self.result.append(sample, ignore_index=True)
        return sample

    def cluster(self):
        self.samples = self.samples.fillna(0)
        kmeans = KMeans(init="random", n_clusters=self.cluster_num, max_iter=300)
        self.labels = kmeans.fit(self.samples).labels_
        self.samples['label'] = self.labels

        # self.cluster_tree = {}
        # self.cluster_tree = {'namespace': 'Clustering', 'name': 'Clustering', 'check': False, 'children': []}
        # for cluster in range(0, max(self.labels)):
        #     node = {'namespace': 'Cluster' + str(cluster), 'name': 'Cluster' + str(cluster), 'check': False, 'children': []}
        #     for index, label in enumerate(self.labels):
        #         if label == cluster:
        #             file_name = list(self.batch_insight.values())[index]['file_name']
        #             node['children'].append({'namespace': list(self.batch_insight)[index], 'name': file_name, 'check': False})

        #     self.cluster_tree['children'].append(node)

    def universal(self, cluster_num):
        res = []
        cluster = self.samples.loc[(self.samples['label'] == cluster_num), :].reset_index(drop=True)
        for column in cluster.columns:
            if len(set(cluster.loc[:, column].values)) == 1:
                res.append(column)
        return res


class BatchStatisticModel(Model):
    async def __init__(self, file_container_model, mode='normal'):
        await super().__init__(file_container_model.namespace + ns.BATCHSTATISTIC, mode)
        self.parent = file_container_model
        self.dir_path = ''
        self.config_path = ''
        self.config = ''
        self.result = pd.DataFrame()

    def model(self):
        return {'namespace':self.namespace, 'result': self.result}

    async def on_new(self, sid, dir_path, config):
        await self.new(dir_path, config)

    async def on_refresh(self, sid, sample):
        await self.emit('refresh', sample, namespace=self.namespace)

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_display_table_dialog(self, sid):
        await self.emit('displayTableDialog', namespace=self.namespace)

    async def new(self, dir_path, config):
        self.dir_path = dir_path
        self.config_path = config
        self.config = json.dumps(json.load(open(config)))

        for path in iterate_files_in_directory(self.dir_path):
            new_file_namespace = self.parent.namespace+'/'+path.split('\\')[-1]
            
            tmp_file = await TextFileModel(self.parent, new_file_namespace, self.dir_path+'\\'+path, 'batch')
            await tmp_file.on_load_config('', [self.dir_path+'\\'+path, self.config], ['search', 'statistic'])
            sample = self.statistic(tmp_file)
            if self.mode == 'normal':
                await self.on_refresh('', sample)
            await tmp_file.on_delete('')
            print('Finish :', tmp_file.file_name)

    @staticmethod
    async def test(new_file_namespace, path):
        tmp_file = await TextFileModel('', new_file_namespace, path, 'batch')
        return tmp_file.file_name
        # await tmp_file.on_load_config('', [self.dir_path+'\\'+path, self.config], ['search', 'statistic'])
        # sample = self.statistic(tmp_file)

    def statistic(self, text_file_model):
        statistic_function_model = text_file_model.text_file_function_model.statistic_function_model
        sample = {'filePath':text_file_model.path, 'configPath':self.config_path, 'fileName': text_file_model.file_name}
        for statistic_namespace in statistic_function_model.models.keys():
            atom = statistic_function_model.models[statistic_namespace]
            sample[atom.alias] = atom.result
        self.result = self.result.append(sample, ignore_index=True)
        return sample


class GlobalChartModel(Model):
    async def __init__(self, namespace, mode='normal'):
        await super().__init__(namespace, mode)

        self.key_value_tree = {}
        self.select_lines = {}

        self.file_container_model = self.subscribe_namespace(self.get_file_container_model_namespace())
        await self.new_view_object()

    def model(self):
        if self.key_value_tree == {}:
            self.reload_global_key_value_tree()
        return {'namespace': self.namespace, 'keyValueTree': self.key_value_tree, 'selectLines':self.select_lines}

    async def listener(self, subscribe_namespace):
        await self.on_refresh_svg('')

    async def on_refresh_svg(self, sid):
        await self.emit('refreshSvg', self.model(), namespace=self.namespace)

    async def on_refresh_chart(self, sid):
        await self.emit('refreshChart', self.model(), namespace=self.namespace)

    async def on_chart(self, sid, model):
        self.__dict__.update(model)

        self.chart()
        await self.emit('refreshChart', self.model(), namespace=self.namespace)

    def chart(self):
        selected_key = {}
        for file_namespace in self.key_value_tree['children']:
            for search_atom_model in self.key_value_tree[file_namespace]['children']:
                for key in search_atom_model['children']:
                    if key['check'] == True:
                        namespace = file_namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION + '/' + search_atom_model['namespace']
                        search_alias = self.file_container_model.text_file_models[file_namespace].search_function_model.search_atom_models[namespace].alias
                        key_value = self.file_container_model.text_file_models[file_namespace].search_function_model.search_atom_models[namespace].res_key_value.__dict__[key['name']]
                        if len(key_value.global_index) > 0:
                            selected_key[self.key_value_tree[file_namespace]['name']+'.'+search_alias+'.'+key['name']] = key_value

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

    def reload_global_key_value_tree(self):
        self.key_value_tree = {}
        self.key_value_tree = {'namespace': 'Key Value', 'name': 'Key Value', 'check': False, 'children': []}
        for file_namespace in self.file_container_model.text_file_models.keys():
            atoms = []
            for chart_namespace in self.file_container_model.text_file_models[file_namespace].chart_function_model.keys():
                chart_atom_model = self.file_container_model.text_file_models[file_namespace].chart_function_model[chart_namespace]
                atoms.append(chart_atom_model.reload_key_value_tree())
            self.key_value_tree['children'].append({'namespace': file_namespace, 'name': self.file_container_model.text_file_models[file_namespace].file_name, 'check': False, 'children': atoms})

    