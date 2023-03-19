from utils import *
from special import take_apart_dcgm, take_apart_telog

import socketio
from aiohttp import web
from aiohttp.web_runner import GracefulExit
from engineio.payload import Payload
from asyncio import get_event_loop
Payload.max_decode_packets = 40000

# sio = socketio.AsyncServer(engineio_logger=True, logger=True, cors_allowed_origins="*")
sio = socketio.AsyncServer(cors_allowed_origins="*")
app = web.Application()
sio.attach(app)

import warnings
warnings.filterwarnings("ignore")

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

# sys.path.append(os.path.join(os.path.dirname(__file__)))
print(os.path.dirname(__file__))
ns = json_to_object(json.load(open(os.path.dirname(__file__) +'\\'+ '../config/namespace.json')))
status = json_to_object(json.load(open(os.path.dirname(__file__) +'\\'+ '../config/status.json')))
msg = json_to_object(json.load(open(os.path.dirname(__file__) +'\\'+ '../config/msg.json')))


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
            sio.register_namespace(self)
        else:
            self.namespace = namespace

        pub.book(self.namespace, self, self.action)
        self.mode = mode
        self.sid = ''
        self.subscribes = []

    async def emit(self, event, *args, namespace, callback=None):
        if self.mode == 'normal':
           await super().emit(event=event, data=args, namespace=namespace, callback=callback)
        else:
            pass
            
    async def action(self, sid, namespace, origin_namespace, func_name, *args):
        # print(namespace.split('/')[-1], origin_namespace.split('/')[-1], func_name)
        func = getattr(self, func_name)
        await func(sid, *args)

    async def publish(self, namespace): #notice subscriber refresh
        await self.parent.listener(namespace)
        await pub.publish(self.namespace)

    async def new_view_object(self):
        if self.mode == 'normal':
            await self.emit('newObject', {'class_name':self.__class__.__name__.replace('Model', 'View'), 'namespace': self.namespace, 'model': self.model()}, namespace = ns.TEXTANALYSIS)
    
    async def change_view_object(self, old_namespace, new_namespace):
        await self.emit('changeObject', {'class_name':self.__class__.__name__.replace('Model', 'View'), 'old_namespace': old_namespace, 'new_namespace': new_namespace}, namespace = ns.TEXTANALYSIS)

    async def on_connected(self, sid, namespace):
        self.sid = sid
        print('Two-way connection established: ', namespace)

    async def on_disconnect(self, sid):
        await sio.disconnect(self.sid)

    async def on_hidden(self, sid):
        await self.emit('hidden', namespace=self.namespace)

    async def on_display(self, sid):
        await self.emit('display', namespace=self.namespace)

    async def on_delete(self, sid):
        await self.emit('delete', namespace = self.namespace)
        await self.on_disconnect(self.sid)
        # del sio.namespace_handlers[self.namespace]

    async def send_message(self, sid, namespace, func_name, *args):
        await pub.send_message(sid, namespace, self.namespace, func_name, *args)

    def on_model(self, sid):
        return self.model()

    def subscribe_namespace(self, namespace):
        self.subscribes.append(namespace)
        return pub.subscribe(self.listener, namespace)

    def get_text_analysis_namespace(self):
        return '/'.join(self.namespace.split('/')[0:2])

    def get_file_container_namespace(self):
        return '/'.join(self.namespace.split('/')[0:3])

    def get_text_file_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])

    def get_text_file_original_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEORIGINAL

    def get_text_file_function_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION

    def get_search_function_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.SEARCHFUNCTION

    def get_insight_function_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.INSIGHTFUNCTION

    def get_chart_function_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.CHARTFUNCTION

    def get_statistic_function_namespace(self):
        return '/'.join(self.namespace.split('/')[0:4])+ns.TEXTFILEFUNCTION+ns.STATISTICFUNCTION

    async def on_display_dialog(self, sid):
        await self.emit('displayDialog', namespace=self.namespace)

    async def on_hidden_dialog(self, sid):
        await self.emit('hiddenDialog', namespace=self.namespace)

    async def on_update_dialog(self, sid):
        await self.emit('updateDialog', self.model(), namespace=self.namespace)

    async def on_display_show(self, sid):
        await self.emit('displayShow', namespace=self.namespace)

    async def on_hidden_show(self, sid):
        await self.emit('hiddenShow', namespace=self.namespace)

    async def is_batch_able(self, namespace):
        pass


class ListModel(Model):
    async def __init__(self, namespace, mode):
        await super().__init__(namespace, mode)
        self.identifier = ''
        self.desc = ''
        self.role_path = ''
        self.text_analysis = self.subscribe_namespace(self.get_text_analysis_namespace())
        self.text_file = self.subscribe_namespace(self.get_text_file_namespace())

    async def on_exec(self, sid, model, mode='new'):
        if (model['identifier'] != self.identifier) & (mode == 'new'):
            await self.on_change(sid, model)
            return

        self.__dict__.update(model)
        if mode == 'new':
            await self.on_refresh(sid)
        else:
            await self.send_message(sid, self.get_file_container_namespace(), 'on_new_function', self.__class__.__name__.split('Atom')[0], model)

    async def on_delete(self, sid):
        await super().on_delete(sid)
        if '/Tmp' not in self.namespace:
            await self.parent.on_delete_single(sid, self.namespace)

    async def on_change(self, sid, model):
        new_namespace = '/'.join(self.namespace.split('/')[0:-1])+'/'+model['name']
        model['namespace'] = new_namespace
        await self.parent.on_change(sid, self.namespace, model)
        await self.change_view_object(self.namespace, new_namespace)
        await sio.disconnect(sid, namespace=self.namespace)
        self.__dict__.update(model)
        sio.register_namespace(self)

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        if '/Tmp' not in self.namespace:
            await self.emit('display', namespace=self.namespace)
            await self.emit('startLoader', namespace=self.namespace)
        await self.parent.is_batch_able(self.namespace)

    async def on_refresh(self, sid):
        func = getattr(self, self.__class__.__name__.split('Atom')[0].lower())
        func()
        await self.parent.is_publish_able(self.namespace)
        await self.emit('refresh', self.model(), namespace=self.namespace)
        await self.emit('stopLoader', namespace=self.namespace)


class BatchModel(Model):
    async def __init__(self, namespace, mode):
        await super().__init__(namespace, mode)
        self.dir_path = ''
        self.config_path = ''
        self.config = ''

    async def on_exec(self, sid, model):
        await self.exec(model)

    async def on_refresh(self, sid, sample):
        if self.mode == 'normal':
            await self.emit('refresh', sample, namespace=self.namespace)


class Fellow(Model):
    async def __init__(self, namespace, mode):
        await super().__init__(namespace, mode)
        self.models = {}
        self.config_count = 0
        self.connected_count = 0
        self.is_load_config = False
        self.model_name = self.__class__.__name__.replace('Function', 'Atom')
        self.class_name = getattr(sys.modules[__name__], self.model_name)

        self.text_file = self.subscribe_namespace(self.get_text_file_namespace())

    def model(self):
        return {}

    async def listener(self, publish_namespace):
        pass

    async def on_load_config(self, sid, models):
        self.connected_count = 0
        self.config_count = len(models)
        self.is_load_config = True

        if self.mode == 'normal':
            for model in models:
                model['namespace'] = self.namespace + '/' + model['identifier']
                await self.emit('new', model, namespace=self.namespace)

        for model in models:
            model['namespace'] = self.namespace + '/' + model['identifier']
            if self.mode == 'normal':
                # await self.emit('new', model, namespace=self.namespace)
                self.models[model['namespace']] = await self.class_name(self, model)
                await self.send_message(sid, self.get_text_file_namespace(), 'on_register_data', self.models[model['namespace']])
            else:
                self.models[model['namespace']] = await self.class_name(self, model, self.mode)
                await self.send_message(sid, self.get_text_file_namespace(), 'on_register_data', self.models[model['namespace']])
                await self.is_batch_able(model['namespace'])

    async def on_new(self, sid, model):
        new_namespace = self.namespace+'/'+model['identifier']
        model['namespace'] = new_namespace
        await self.emit('new', model, namespace=self.namespace)
        self.models[new_namespace] = await self.class_name(self, model)
        await self.send_message(sid, self.get_text_file_namespace(), 'on_register_data', self.models[new_namespace])

    async def on_change(self, sid, old_namespace, new):
        await self.send_message(sid, self.get_text_file_namespace(), 'on_change_data', self.models[old_namespace].identifier, new['name'])
        self.models[new['namespace']] = self.models[old_namespace]
        del self.models[old_namespace]
    
    async def on_delete_single(self, sid, namespace):
        await self.send_message(sid, self.get_text_file_namespace(), 'on_logout_data', self.models[namespace])
        self.models[namespace] = ''
        del self.models[namespace]

    async def on_delete_all(self, sid):
        ns = list(set(self.models.keys()))
        for namespace in ns:
            await self.on_delete_single(sid, namespace)

    async def on_refresh_roles(self, sid):
        for namespace in self.models.keys():
            if self.models[namespace].role_path == '':
                continue
            else:
                roles = self.models[namespace].role_path.split('.')
                for index, role in enumerate(roles):
                    if self.text_file.roles.contains(role):
                        if index == len(roles) - 1:
                            self.text_file.roles.update_node(role, parent=roles[index-1], data = self.models[namespace].model())
                    else:
                        self.text_file.roles.create_node(role, role, parent=roles[index-1], data = self.models[namespace].model() if index == len(roles) - 1 else None)

        # self.text_file.roles.show()
        data_tree = convert_dict_format(self.text_file.roles.to_dict(sort=False, with_data=True))
        await self.text_file.text_file_original.on_refresh_story_lines(sid, data_tree)

    async def is_publish_able(self, namespace): #notice subscriber refresh
        if self.config_count > 0:
            self.config_count = self.config_count - 1

        if self.config_count == 0:
            await super().publish(namespace)

    async def is_batch_able(self, namespace):
        if self.is_load_config:
            self.connected_count = self.connected_count + 1
            if self.connected_count >= self.config_count:
                # self.text_analysis.parallel.parallel(self.models)
                for namespace in self.models.keys():
                    if self.mode == 'normal':
                        await self.models[namespace].on_refresh('')
                    else:
                        func = getattr(self.models[namespace], self.__class__.__name__.split('Function')[0].lower())
                        func()
                
                await self.on_refresh_roles('')

                self.is_load_config = False
                self.connected_count = 0
                if self.mode == 'normal':
                    await self.text_file.on_load_next_config('')
        else:
            if self.mode == 'normal':
                await self.models[namespace].on_refresh('')
            else:
                func = getattr(self.models[namespace], self.__class__.__name__.split('Function')[0].lower())
                func()
            await self.on_refresh_roles('')


class TextAnalysisModel(Model):
    async def __init__(self, parallel, mode='normal'):
        await super().__init__(ns.TEXTANALYSIS, mode)

        self.parallel = parallel
        self.file_container = await FileContainerModel(self, self.mode)

        self.batch_insight = await BatchInsightModel(self, self.mode)
        self.batch_statistic = await BatchStatisticModel(self, self.mode)
        self.text_file_compare = await TextFileCompareModel(self, self.mode)
        self.global_chart = await GlobalChartModel(self, self.mode)

    async def listener(self, publish_namespace):
        pass

    async def on_display_batch_insight(self, sid):
        await self.batch_insight.on_display_dialog(sid)

    async def on_display_batch_statistic(self, sid):
        await self.batch_statistic.on_display_dialog(sid)

    async def on_display_batch_insight_show(self, sid):
        await self.batch_insight.on_display_show(sid)

    async def on_display_batch_statistic_show(self, sid):
        await self.batch_statistic.on_display_show(sid)
 
    async def on_display_global_chart(self, sid):
        await self.global_chart.on_display_dialog(sid)

    async def on_display_global_chart_show(self, sid):
        await self.global_chart.on_display_show(sid)

    async def on_display_text_file_compare(self, sid):
        await self.text_file_compare.on_display_dialog(sid)

    async def on_display_text_file_compare_show(self, sid):
        await self.text_file_compare.on_display_show(sid)

    async def on_shutdown(self, sid):
        await app.shutdown()
        await app.cleanup()
        raise GracefulExit()


class FileContainerModel(Model):
    async def __init__(self, text_analysis, mode='normal'):
        await super().__init__(text_analysis.namespace + ns.FILECONTAINER, mode)
        self.parent = text_analysis

        self.text_files = {}
        self.active_text_file = ''

    async def listener(self, publish_namespace):
        await self.publish(publish_namespace)

    async def on_new_file(self, sid, file_paths):
        for path in file_paths:
            new_file_namespace = self.namespace+'/'+path.split('\\')[-1]
            # new_file_namespace = self.namespace + '/' + createUuid4()
            
            self.text_files[new_file_namespace] = await TextFileModel(self, new_file_namespace, path, self.mode)
            await self.emit('newFile', self.text_files[new_file_namespace].model(), namespace=self.namespace)
            await self.on_display_file(sid, new_file_namespace)
        
    def on_get_config(self, sid):
        return self.text_files[self.active_text_file].on_get_config()

    async def on_load_config(self, sid, config):
        await self.text_files[self.active_text_file].on_load_config(sid, config)

    async def on_load_next_config(self, sid):
        await self.text_files[self.active_text_file].on_load_next_config(sid)

    async def on_new_function(self, sid, func, model):
        await self.send_message(sid, self.active_text_file + ns.TEXTFILEFUNCTION, 'on_select_function', func.lower())
        await self.send_message(sid, self.active_text_file, 'on_adjust_view_rate', 0.5)

        namespace = self.active_text_file + ns.TEXTFILEFUNCTION + '/' + func + 'Function'
        await self.send_message(sid, namespace, 'on_new', model)

    async def on_display_file(self, sid, namespace):
        if self.active_text_file != namespace:
            params = {'earlier_active_text_file': self.active_text_file, 'active_text_file': ''}
            for text_file in self.text_files.keys():
                await self.text_files[text_file].on_hidden(sid)
            self.active_text_file = namespace

            await self.text_files[namespace].on_display(sid)
            params['active_text_file'] = self.active_text_file
            await self.emit('displayFile', params, namespace=self.namespace)

    async def on_display_text_file_function(self, sid):
        await self.text_files[self.active_text_file].text_file_function.on_display(sid)

    async def on_display_tmp_search_atom_dialog(self, sid):
        await self.text_files[self.active_text_file].on_display_tmp_search_atom_dialog(sid)

    async def on_display_tmp_insight_atom_dialog(self, sid):
        await self.text_files[self.active_text_file].on_display_tmp_insight_atom_dialog(sid)

    async def on_display_tmp_chart_atom_svg_dialog(self, sid):
        await self.text_files[self.active_text_file].on_display_tmp_chart_atom_svg_dialog(sid)

    async def on_display_tmp_statistic_atom_dialog(self, sid):
        await self.text_files[self.active_text_file].on_display_tmp_statistic_atom_dialog(sid)
   
    def on_dcgm_analysis(self, sid, params):
        print('Dcgm Analysis!', params)
        try:
            take_apart_dcgm(params['dcgm_dir'] + '\\', params['save_dir'] + '\\', params['telog_filter'], params['elog_filter'], params['is_into_one_file'])
            return Response(status.SUCCESS, msg.NONE, '').__dict__
        except Exception as e:
            return Response(status.ERROR, str(e), '').__dict__

    def on_telog_analysis(self, sid, params):
        print('Telog Analysis!', params)
        try:
            take_apart_telog(params['telog_dir'] + '\\', params['save_dir'] + '\\', params['telog_filter'])
            return Response(status.SUCCESS, msg.NONE, '').__dict__
        except Exception as e:
            return Response(status.ERROR, str(e), '').__dict__


class TextFileModel(Model):
    async def __init__(self, file_container, namespace, path, mode='normal'):
        await super().__init__(namespace, mode)
        self.parent = file_container

        self.data = {}
        self.path = path
        self.file_name = path.split('\\')[-1]
        self.config = {}
        self.load = ['search', 'chart', 'insight', 'statistic']
        self.load_order = 0

        with open(self.path, 'r') as f:
            self.lines = f.readlines()
            # self.lines = self.parent.parent.parallel.copy_to_shm(self.namespace, f.readlines())

        self.roles = Tree()
        self.roles.create_node("root", "root", data=None)

        await self.new_view_object()
        self.text_file_original = await TextFileOriginalModel(self, mode)
        self.text_file_function = await TextFileFunctionModel(self, mode)

        if self.mode == 'normal':
            self.tmp_search_atom = await SearchAtomModel(self, {'namespace': self.namespace + ns.TMPSEARCHATOM})
            self.tmp_insight_atom = await InsightAtomModel(self, {'namespace': self.namespace + ns.TMPINSIGHATOM})
            self.tmp_chart_atom = await ChartAtomModel(self, {'namespace': self.namespace + ns.TMPCHARTATOM})
            self.tmp_statistic_atom = await StatisticAtomModel(self, {'namespace': self.namespace + ns.TMPSTATISTICATOM})

    def model(self):
        return {'namespace': self.namespace, 'file_name':self.file_name, 'path': self.path, 'config': self.config}

    async def listener(self, publish_namespace):
        # if 'SearchFunction' in publish_namespace:
        #     pass

        await self.publish(publish_namespace)

    async def on_delete(self, sid):
        self.lines = ''

        if self.mode == 'normal':
            await self.text_file_function.search_function.on_delete_all(sid)
            await self.text_file_function.insight_function.on_delete_all(sid)
            await self.text_file_function.chart_function.on_delete_all(sid)
            await self.text_file_function.statistic_function.on_delete_all(sid)

            await self.text_file_function.search_function.on_delete(sid)
            await self.text_file_function.insight_function.on_delete(sid)
            await self.text_file_function.chart_function.on_delete(sid)
            await self.text_file_function.statistic_function.on_delete(sid)

            await self.text_file_original.on_delete(sid)
            await self.text_file_function.on_delete(sid)

            await self.tmp_search_atom.on_delete(sid)
            await self.tmp_insight_atom.on_delete(sid)
            await self.tmp_chart_atom.on_delete(sid)
            await self.tmp_statistic_atom.on_delete(sid)

            await self.emit('delete', namespace = self.namespace)
            await super().on_delete(sid)
        self.parent.text_files[self.namespace] = ''
        del self.parent.text_files[self.namespace]
        
    def on_get_config(self):
        self.config['search'] = []
        self.config['insight'] = []
        self.config['chart'] = []
        self.config['statistic'] = []

        for search_atom in self.text_file_function.search_function.models.keys():
            model = self.text_file_function.search_function.models[search_atom].__dict__
            tmp = {'role_path':model['role_path'], 'identifier':model['identifier'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
            'exp_mark':model['exp_mark'], 'is_active':model['is_active'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
            self.config['search'].append(tmp)

        for insight_atom in self.text_file_function.insight_function.models.keys():
            model = self.text_file_function.insight_function.models[insight_atom].__dict__
            tmp = {'role_path':model['role_path'], 'identifier':model['identifier'], 'desc':model['desc'], 'exp_search':model['exp_search'], 'exp_extract':model['exp_extract'],
            'exp_mark':model['exp_mark'], 'is_case_sensitive':model['is_case_sensitive'], 'forward_rows':model['forward_rows'], 'backward_rows':model['backward_rows']}
            self.config['insight'].append(tmp)

        for chart_atom in self.text_file_function.chart_function.models.keys():
            model = self.text_file_function.chart_function.models[chart_atom].__dict__
            tmp = {'role_path':model['role_path'], 'identifier':model['identifier'], 'desc':model['desc'], 'key_value_tree': model['key_value_tree']}
            self.config['chart'].append(tmp)

        for statistic_atom in self.text_file_function.statistic_function.models.keys():
            model = self.text_file_function.statistic_function.models[statistic_atom].__dict__
            tmp = {'role_path':model['role_path'], 'identifier':model['identifier'], 'desc':model['desc'], 'code':model['code'], 'statistic_type':model['statistic_type']}
            self.config['statistic'].append(tmp)

        return Response(status.SUCCESS, msg.NONE, self.config).__dict__

    async def on_load_all_config(self, sid, path, load=['search', 'chart', 'insight', 'statistic']):
        self.path = path
        self.load = load
        self.load_order = 0
        with open(self.path) as f:
            self.config = json.loads(f.read())

        if (len(self.config['search']) > 0):
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'search')
            search_atoms = self.config['search']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION, 'on_load_config', search_atoms)

        if (len(self.config['chart']) > 0):
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'chart')
            chart_atoms = self.config['chart']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION, 'on_load_config', chart_atoms)

        if (len(self.config['insight']) > 0):
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'insight')
            insight_atoms = self.config['insight']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.INSIGHTFUNCTION, 'on_load_config', insight_atoms)

        if (len(self.config['statistic']) > 0):
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'statistic')
            statistic_atoms = self.config['statistic']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION, 'on_load_config', statistic_atoms)

    async def on_load_config(self, sid, path, load=['search', 'chart', 'insight', 'statistic']):
        self.path = path
        self.load = load
        self.load_order = 0
        with open(self.path) as f:
            self.config = json.loads(f.read())
        await self.on_adjust_view_rate(sid, 0.5)
        await self.on_load_next_config(sid)

    async def on_load_next_config(self, sid):
        if self.load_order >= len(self.load):
            return

        load_flag = False
        if (not load_flag) & (len(self.config['search']) > 0) & (self.load[self.load_order] == 'search'):
            load_flag = True
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'search')
            search_atoms = self.config['search']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION, 'on_load_config', search_atoms)

        if (not load_flag) & (len(self.config['chart']) > 0) & (self.load[self.load_order] == 'chart'):
            load_flag = True
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'chart')
            chart_atoms = self.config['chart']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.CHARTFUNCTION, 'on_load_config', chart_atoms)

        if (not load_flag) & (len(self.config['insight']) > 0) & (self.load[self.load_order] == 'insight'):
            load_flag = True
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'insight')
            insight_atoms = self.config['insight']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.INSIGHTFUNCTION, 'on_load_config', insight_atoms)

        if (not load_flag) & (len(self.config['statistic']) > 0) & (self.load[self.load_order] == 'statistic'):
            load_flag = True
            await self.send_message(sid, self.text_file_function.namespace, 'on_select_function', 'statistic')
            statistic_atoms = self.config['statistic']
            await self.send_message(sid, self.namespace + ns.TEXTFILEFUNCTION + ns.STATISTICFUNCTION, 'on_load_config', statistic_atoms)

        self.load_order = self.load_order + 1
        if not load_flag:
            await self.on_load_next_config(sid)

    async def on_register_data(self, sid, ref):
        self.data[ref.identifier] = ref

    async def on_change_data(self, sid, old_ref, new_ref):
        self.data[new_ref] = self.data[old_ref]
        del self.data[old_ref]

    async def on_logout_data(self, sid, ref):
        self.data[ref.identifier] = ''
        del self.data[ref.identifier]

    async def on_adjust_view_rate(self, sid, rate):
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_set_height', rate)
        await self.send_message(sid, self.get_text_file_function_namespace(), 'on_set_height', 1 - rate)

    async def on_display_tmp_search_atom_dialog(self, sid):
        await self.tmp_search_atom.on_display_dialog(sid)

    async def on_display_tmp_insight_atom_dialog(self, sid):
        await self.tmp_insight_atom.on_display_dialog(sid)

    async def on_display_tmp_chart_atom_svg_dialog(self, sid):
        await self.tmp_chart_atom.on_display_dialog(sid)

    async def on_display_tmp_statistic_atom_dialog(self, sid):
        await self.tmp_statistic_atom.on_display_dialog(sid)


class TextFileOriginalModel(Model):
    async def __init__(self, text_file, mode='normal'):
        await super().__init__(text_file.namespace+ns.TEXTFILEORIGINAL, mode)
        self.parent = text_file
        self.rate_height = 1
        self.step = 1
        self.point = 0
        self.range = 60
        self.count =  len(text_file.lines)
        self.display_lines = []

        self.words = []
        self.marks = []
        self.specials = []

        self.data_tree = {}

        await self.new_view_object()
        
    def model(self):
        return {'namespace': self.namespace, 'point': self.point, 'rate_height': self.rate_height, 'point': self.point, 
                'range': self.range, 'count': self.count, 'display_lines': self.display_lines, 'data_tree': self.data_tree}

    async def listener(self, publish_namespace):
        await self.on_set_height('', 1)
        await self.on_scroll('', 0)

    async def on_connected(self, sid, namespace):
        await super().on_connected(sid, namespace)
        await self.on_scroll(sid, 0, self.range)

    async def on_set_height(self, sid, rate):
        self.rate_height = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)

    async def on_scroll(self, sid, point=None, range=None):
        if (point is None) & (range is None):
            self.scroll(self.point, self.range)
        elif (point is not None) & (range is None):
            self.scroll(point, self.range)
        else:
            self.scroll(point, range)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_jump(self, sid, d):
        namespace = self.parent.text_file_function.search_function.namespace + '/' + d['identifier']
        await self.parent.text_file_function.search_function.models[namespace].on_active(sid)
        await self.parent.text_file_function.search_function.models[namespace].on_scroll(sid, d['search_index'])

        self.parent.text_file_function.search_function.active_search_atom = self.parent.text_file_function.search_function.models[namespace]
        await self.on_refresh_acitve(sid)
        await self.on_scroll(sid, d['global_index'])
        await self.send_message(sid, self.get_file_container_namespace(), 'on_display_file', self.get_text_file_namespace())

    async def on_refresh_acitve(self, sid):
        res_key_value = self.parent.text_file_function.search_function.active_search_atom.res_key_value
        self.specials = self.parent.text_file_function.search_function.active_search_atom.specials
        self.words = []
        self.marks = []
        for key in res_key_value.keys():
            if res_key_value[key]['type'] == 'mark':
                self.marks.append(res_key_value[key])
            else:
                self.words.append(key)
        
    async def on_refresh_story_lines(self, sid, data_tree):
        self.data_tree = data_tree
        await self.emit('refreshStoryLines', self.model(), namespace=self.namespace)

    def scroll(self, point, range):
        def word_color_replace(word):
            return word.group(0).replace(word.group(1), '<span style="color:'+color[self.words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        
        if point in [1, -1]:
            self.point = self.point + point
        else:
            self.point = point
        if self.point < 0:
            self.point = 0
        self.range = range
        self.display_lines = []
        if (self.point + self.range) > len(self.parent.lines):
            self.point = len(self.parent.lines) - self.range

        reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.words)+')'+ '['+'|'.join(special_symbols)+']'
        for index, line in enumerate(self.parent.lines[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'

            flag = True
            for mark in self.marks:
                if self.point + index in mark['global_index']:
                    flag = False
                    self.display_lines.append(num+'<td style="color:'+mark['value'][0]+';white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
                    break

            if flag:
                if index in self.specials:
                    self.display_lines.append(num+'<td style="background-color:#FFD700;color:#000;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
                    continue
        
                if len(self.words) > 0:
                    self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, line)+'</td>')
                else:
                    self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')


class TextFileFunctionModel(Model):
    async def __init__(self, text_file, mode='normal'):
        await super().__init__(text_file.namespace+ns.TEXTFILEFUNCTION, mode)
        self.parent = text_file
        self.rate_height = 0.5

        await self.new_view_object()
        self.search_function = await SearchFunctionModel(self, mode)
        self.insight_function = await InsightFunctionModel(self, mode)
        self.chart_function = await ChartFunctionModel(self, mode)
        self.statistic_function = await StatisticFunctionModel(self, mode)

    def model(self):
        return {'namespace': self.namespace, 'rate_height': self.rate_height}

    async def listener(self, publish_namespace):
        await self.publish(publish_namespace)

    async def on_set_height(self, sid, rate):
        self.rate_height = rate
        await self.emit('setHeight', self.model(), namespace=self.namespace)

    async def on_display(self, sid):
        await super().on_display(sid)
        await self.send_message(sid, self.get_text_file_namespace(), 'on_adjust_view_rate', 0.5)

    async def on_hidden(self, sid):
        await super().on_hidden(sid)
        await self.send_message(sid, self.get_text_file_namespace(), 'on_adjust_view_rate', 1)

    async def on_select_function(self, sid, function):
        await self.on_display(sid)
        if function == 'search':
            await self.send_message(sid, self.get_search_function_namespace(), 'on_display')
            await self.send_message(sid, self.get_insight_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_namespace(), 'on_hidden')
        elif function == 'insight':
            await self.send_message(sid, self.get_search_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_namespace(), 'on_display')
            await self.send_message(sid, self.get_chart_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_namespace(), 'on_hidden')
        elif function == 'chart':
            await self.send_message(sid, self.get_search_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_namespace(), 'on_display')
            await self.send_message(sid, self.get_statistic_function_namespace(), 'on_hidden')
        elif function == 'statistic':
            await self.send_message(sid, self.get_search_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_insight_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_chart_function_namespace(), 'on_hidden')
            await self.send_message(sid, self.get_statistic_function_namespace(), 'on_display')
        await self.emit('displayFunction', function, namespace=self.namespace)


class SearchFunctionModel(Fellow):
    async def __init__(self, text_file_function, mode='normal'):
        await super().__init__(text_file_function.namespace+ns.SEARCHFUNCTION, mode)
        self.parent = text_file_function
        self.active_search_atom = None
        await self.new_view_object()


class InsightFunctionModel(Fellow):
    async def __init__(self, text_file_function, mode='normal'):
        await super().__init__(text_file_function.namespace+ns.INSIGHTFUNCTION, mode)
        self.parent = text_file_function
        await self.new_view_object()


class ChartFunctionModel(Fellow):
    async def __init__(self, text_file_function, mode='normal'):
        await super().__init__(text_file_function.namespace+ns.CHARTFUNCTION, mode)
        self.parent = text_file_function
        await self.new_view_object()


class StatisticFunctionModel(Fellow):
    async def __init__(self, text_file_function, mode='normal'):
        await super().__init__(text_file_function.namespace+ns.STATISTICFUNCTION, mode)
        self.parent = text_file_function
        await self.new_view_object()


class SearchAtomModel(ListModel):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent
        self.is_active = False
        self.words = []
        self.marks = []
        self.specials = []

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
        self.res_marks = {}
        self.res_lines = []
        self.res_compare_special_lines = []
        self.res_clean_lines = []

        self.start_global_index = 0
        self.end_global_index = 0
        self.start_timestamp = 0
        self.end_timestamp = 0

        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'role_path': self.role_path, 'type': 'search', 'count': self.count, 'point': self.point, 'namespace': self.namespace, 'identifier': self.identifier, 'desc':self.desc, 'exp_search': self.exp_search, 'res_marks': self.res_marks,
        'is_active': self.is_active, 'is_case_sensitive':self.is_case_sensitive, 'forward_rows':self.forward_rows, 'backward_rows':self.backward_rows, 'exp_extract': self.exp_extract, 'res_compare_special_lines': self.res_compare_special_lines, 'res_clean_lines': self.res_clean_lines,
        'exp_mark': self.exp_mark, 'display_lines': self.display_lines, 'start_global_index':self.start_global_index, 'end_global_index': self.end_global_index, 'start_timestamp':self.start_timestamp, 'end_timestamp': self.end_timestamp}

    async def listener(self, publish_namespace):
        pass
        # if publish_namespace == self.text_file.namespace:
        #     self.search()
        #     await self.on_scroll('', 0)

    async def on_refresh(self, sid):
        await super().on_refresh(sid)
        if self.is_active == True:
            await self.on_active(sid)

    async def on_active(self, sid):
        if self.parent.active_search_atom is not None:
            await self.parent.active_search_atom.on_deactive(sid)

        self.is_active = True
        self.parent.active_search_atom = self
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_refresh_acitve')
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_scroll')
        await self.emit('active', namespace=self.namespace)

    async def on_deactive(self, sid):
        self.is_active = False
        await self.emit('deactive', namespace=self.namespace)

    async def on_scroll(self, sid, point):
        self.scroll(point)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_text_click_event(self, sid, params):
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_scroll', params['globalIndex'])

    def search(self):
        self.res_lines = []
        self.res_key_value = {}
        self.res_search_units = []
        for index, line in enumerate(self.text_file.lines):
            if self.is_case_sensitive:
                if len(re.findall(self.exp_search, line)) > 0:
                    self.res_search_units.append({'range': [index-self.forward_rows, index+self.backward_rows+1], 'timestamp':0})
            else:
                if len(re.findall(self.exp_search, line, flags=re.IGNORECASE)) > 0:
                    self.res_search_units.append({'range': [index-self.forward_rows, index+self.backward_rows+1], 'timestamp':0})

        self.extract()
        for unit in self.res_search_units:
            self.res_lines.extend(range(unit['range'][0], unit['range'][1]))
        self.res_lines = sorted(set(self.res_lines))
        self.start_global_index = min(self.res_lines) if len(self.res_lines) != 0 else 0
        self.end_global_index = max(self.res_lines) if len(self.res_lines) != 0 else 0
        self.count = len(self.res_lines)

        self.words = []
        self.marks = []
        self.res_marks = {}
        for key in self.res_key_value.keys():
            if self.res_key_value[key]['type'] == 'mark':
                self.marks.append(self.res_key_value[key])
                self.res_marks[key] = json.loads(pd.DataFrame(self.res_key_value[key]).to_json(orient='records'))
            else:
                self.words.append(key)

        self.scroll(0) 

    def extract(self):
        if len(self.exp_extract) == 0:
            return

        self.res_key_value = {}
        tmp_timestamps = []
        for search_index, unit in enumerate(self.res_search_units):
            string = '\n'.join(self.text_file.lines[unit['range'][0]:unit['range'][1]])
            ts = ''
            # handle key value
            for exp in self.exp_extract:
                r = parse(exp, string)

                if r is not None:
                    if 'timestamp' in r.named:
                        ts = convert_datetime_timestamp(r.named['timestamp'])
                    else:
                        ts = unit['range'][0]
                    for key in r.named.keys():
                        if key == 'timestamp':
                            continue
                        if key not in self.res_key_value:
                            self.res_key_value[key] = {'identifier': self.identifier, 'name':key, 'type': type(r.named[key]).__name__, 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                        self.res_key_value[key]['global_index'].append(unit['range'][0]+self.backward_rows)
                        self.res_key_value[key]['search_index'].append(search_index)
                        self.res_key_value[key]['value'].append(r.named[key])
                        self.res_key_value[key]['timestamp'].append(ts)
                    break

            # handle mark
            for exp in self.exp_mark:
                if len(re.findall(exp['exp'], string, flags=re.IGNORECASE)) > 0:
                    if exp['abbr'] not in self.res_key_value:
                        self.res_key_value[exp['abbr']] = {'identifier': self.identifier, 'name':exp['abbr'], 'type': 'mark', 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                    self.res_key_value[exp['abbr']]['global_index'].append(unit['range'][0]+self.backward_rows)
                    self.res_key_value[exp['abbr']]['search_index'].append(search_index)
                    self.res_key_value[exp['abbr']]['value'].append(exp['color'])
                    self.res_key_value[exp['abbr']]['timestamp'].append(ts)

            self.res_search_units[search_index]['timestamp'] = ts
            tmp_timestamps.append(ts)
        
        self.start_timestamp = min(tmp_timestamps) if len(tmp_timestamps) != 0 else 0
        self.end_timestamp = max(tmp_timestamps) if len(tmp_timestamps) != 0 else 0

    def scroll(self, point):
        def word_color_replace(word):
            return word.group(0).replace(word.group(1), '<span style="color:'+color[self.words.index(word.group(1))]+'">'+word.group(1)+'</span>')

        if point in [1, -1]:
            self.point = self.point + point
        else:
            self.point = point
        if self.point < 0:
            self.point = 0

        self.display_lines = []
        if (self.point + self.range) > len(self.res_lines):
            self.point = len(self.res_lines) - self.range

        reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.words)+')'+ '['+'|'.join(special_symbols)+']'
        for index, line in enumerate(self.res_lines[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'

            flag = True
            for mark in self.marks:
                if self.point + index in mark['search_index']:
                    flag = False
                    self.display_lines.append({'text': num+'<td style="color:'+mark['value'][0]+';white-space:nowrap;font-size:12px;text-align:left">'+self.text_file.lines[line]+'</td>', 'global_index': line})
                    break

            if flag:
                if line in self.specials:
                    self.display_lines.append({'text': num+'<td style="background-color:#FFD700;color:#000;white-space:nowrap;font-size:12px;text-align:left">'+self.text_file.lines[line]+'</td>', 'global_index': line})
                    continue
        
                if len(self.words) > 0:
                    self.display_lines.append({'text': num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, self.text_file.lines[line])+'</td>', 'global_index': line})
                else:
                    self.display_lines.append({'text': num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+self.text_file.lines[line]+'</td>', 'global_index': line})


class ChartAtomModel(ListModel):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.key_value_tree = {}
        self.select_lines = {}

        self.search_function = self.subscribe_namespace(self.get_search_function_namespace())
        self.text_file = self.search_function.parent.parent
        
        self.start_global_index = 0
        self.end_global_index = 0
        self.start_timestamp = 0
        self.end_timestamp = 0

        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        if self.key_value_tree == {}:
            self.generate_key_value_tree()
        return {'role_path': self.role_path, 'type': 'chart', 'namespace': self.namespace, 'identifier': self.identifier, 'desc': self.desc, 'key_value_tree': self.key_value_tree, 'select_lines':self.select_lines,
                'start_global_index':self.start_global_index, 'end_global_index': self.end_global_index, 'start_timestamp':self.start_timestamp, 'end_timestamp': self.end_timestamp}

    async def listener(self, publish_namespace):
        if publish_namespace == self.search_function.namespace:
            self.generate_key_value_tree()
            await self.on_update_dialog('')

    async def on_click_event(self, sid, params):
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_scroll', params['data']['globalIndex'])

    async def on_clear_key_value_tree(self, sid):
        self.generate_key_value_tree()
        await self.on_update_dialog(sid)

    def chart(self):
        self.select_lines = {}
        selected_key = {}
        for search_atom in self.key_value_tree['children']:
            for key in search_atom['children']:
                if key['check'] == True:
                    namespace = self.text_file.namespace + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION + '/' + search_atom['namespace']
                    identifier = self.search_function.models[namespace].identifier
                    if key['name'] in self.search_function.models[namespace].res_key_value:
                        key_value = self.search_function.models[namespace].res_key_value[key['name']]
                        if len(key_value['global_index']) > 0:
                            selected_key[identifier+'.'+key['name']] = key_value
        final = {}
        tmp_start_global_indices = []
        tmp_end_global_indices = []
        tmp_start_timestamps = []
        tmp_end_timestamps = []
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
            res = res.drop_duplicates(['timestamp'])
            res = res.sort_values('timestamp', ascending=True).reset_index(drop=True)
            res = res.loc[(res['full_name'] == key), :].reset_index()
            res = res.rename(columns={"index": "graph_index"})
            # res['timestamp'] = res['timestamp'].astype(str)
            tmp_start_global_indices.append(res['global_index'].values[0])
            tmp_end_global_indices.append(res['global_index'].values[-1])
            tmp_start_timestamps.append(res['timestamp'].values[0])
            tmp_end_timestamps.append(res['timestamp'].values[-1])
            final[key] = json.loads(res.to_json(orient='records'))

        self.start_global_index = int(min(tmp_start_global_indices))
        self.end_global_index = int(max(tmp_end_global_indices))
        self.start_timestamp = float(min(tmp_start_timestamps))
        self.end_timestamp = float(max(tmp_end_timestamps))
        self.select_lines = final

    def generate_key_value_tree(self):
        self.key_value_tree = {}

        self.key_value_tree = {'namespace': self.text_file.namespace.split('/')[-1], 'name': 'Key Value', 'check': False, 'children': []}
        for namespace in self.search_function.models.keys():
            keys = []
            for key in self.search_function.models[namespace].res_key_value.keys():
                keys.append({'name': key, 'check': False})
            self.key_value_tree['children'].append({'namespace': namespace.split('/')[-1], 'name': self.search_function.models[namespace].identifier, 'check': False, 'children': keys})

    def reload_key_value_tree(self):
        tmp_key_value_tree = {'namespace': self.text_file.namespace.split('/')[-1], 'name': 'Key Value', 'check': False, 'children': []}
        for namespace in self.search_function.models.keys():
            keys = []
            for key in self.search_function.models[namespace].res_key_value.__dict__.keys():
                keys.append({'name': key, 'check': False})
            tmp_key_value_tree['children'].append({'namespace': namespace.split('/')[-1], 'name': self.search_function.models[namespace].name, 'check': False, 'children': keys})

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


class InsightAtomModel(ListModel):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.exp_search = ''
        self.exp_extract = ''
        self.exp_mark = ''
        self.is_case_sensitive = True

        self.forward_rows = 0
        self.backward_rows = 0

        # self.forward_range = 60
        # self.backward_range = 2
        self.number = 0

        self.point = 0
        self.range = 15
        self.step = 1
        self.count = 0
        self.display_lines = []

        self.is_has_mark = False
        self.res_search_units = []
        self.res_key_value = {}
        self.res_lines = []
        self.res_mark = {}
        self.res_residue_marks = []

        # self.compare_graphs = [
        #     {'abnormal_type': 'AbnormalUpPulse', 'value': [0,1,0], 'similarity': 0.7, 'inflection_point':0, 'outlier':1, 'return_point':2},
        #     {'abnormal_type': 'AbnormalDownPulse', 'value': [1,0,1], 'similarity': 0.7, 'inflection_point':0, 'outlier':1, 'return_point':2},
        #     {'abnormal_type': 'AbnormalUp', 'value': [0,0,1,1], 'similarity': 0.75, 'inflection_point':1, 'outlier':2},
        #     {'abnormal_type': 'AbnormalDown', 'value': [1,1,0,0], 'similarity': 0.75, 'inflection_point':1, 'outlier':2}
        # ]
        # self.scale_max = 100

        self.outlier = []
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'role_path': self.role_path, 'type': 'insight', 'count': self.count, 'namespace': self.namespace, 'identifier': self.identifier, 'desc':self.desc, 'exp_search': self.exp_search, 
        'is_case_sensitive':self.is_case_sensitive, 'forward_rows':self.forward_rows, 'backward_rows':self.backward_rows, 'exp_extract': self.exp_extract, 'exp_mark': self.exp_mark, 'display_lines': self.display_lines}

    async def listener(self, publish_namespace):
        pass

    async def on_chart_click_event(self, sid, params):
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_scroll', params['data']['globalIndex'])

    async def on_text_click_event(self, sid, params):
        await self.send_message(sid, self.get_text_file_original_namespace(), 'on_scroll', params['globalIndex'])

    def insight(self):
        self.is_has_mark = False
        self.count = 0
        self.outlier = []
        self.res_search_units = []
        self.res_key_value = {}
        self.res_lines = []
        self.res_mark = {}
        self.res_residue_marks = []
        filter_strs = ['name', 'id', '.cc']

        self.search()

        select_mark = {}
        if self.is_has_mark:
            for mark in self.res_mark.keys():
                mark_timestamp = self.res_mark[mark]['timestamp'][0]
                mark_global_index = self.res_mark[mark]['global_index'][0]
                mark_search_index = self.res_mark[mark]['search_index'][0]
                select_mark = {'name': mark, 'type': 'mark', 'abnormal_type': 'ManualSelect', 'global_index':self.res_mark[mark]['global_index'][self.number], 
                    'search_index':self.res_mark[mark]['search_index'][self.number], 'timestamp':self.res_mark[mark]['timestamp'][self.number], 
                    'value':self.res_mark[mark]['value'][self.number], 'desc':self.res_mark[mark]['name'], 'origin': self.text_file.lines[self.res_mark[mark]['global_index'][self.number]]}

            self.outlier.extend(self.judge_mark_outlier(self.res_residue_marks, mark_timestamp, mark_global_index, mark_search_index))

            for key in self.res_key_value.keys():
                flag =  True
                for c in filter_strs:
                    if c in key.lower():
                        flag = False
                if key[0].isdigit():
                    flag = False

                if flag:
                    if (len(self.res_key_value[key]['global_index']) > 0):
                        if (self.res_key_value[key]['type'] == 'str'):
                            outlier = self.judge_discrete_key_value_outlier(self.res_key_value[key], mark_timestamp, mark_global_index, mark_search_index)
                        else:
                            outlier = self.judge_consecutive_key_value_outlier(self.res_key_value[key], mark_timestamp, mark_global_index, mark_search_index, self.res_mark[list(self.res_mark.keys())[0]])
                        self.outlier.extend(outlier)

            # outlier sort 
            self.outlier = pd.DataFrame(self.outlier)
            self.outlier = self.outlier.sort_values('timestamp', ascending=True).reset_index(drop=True)
            self.outlier =  json.loads(self.outlier.to_json(orient='records'))
            self.outlier.append(select_mark)
            self.count = len(self.outlier)
            self.display_lines = self.outlier
            # self.scroll(0)

    def search(self):
        self.res_search_units = []

        for index, line in enumerate(self.text_file.lines):
            if len(re.findall(self.exp_search, line, flags= 0 if self.is_case_sensitive else re.IGNORECASE)) > 0:
                self.res_search_units.append([index-self.forward_rows, index+self.backward_rows+1])
                if not self.is_has_mark:
                    if len(re.findall(self.exp_mark['exp'], line, flags=re.IGNORECASE)) > 0:
                        self.is_has_mark = True

        if self.is_has_mark:
            self.fuzzy_extract()

    def fuzzy_extract(self):
        def self_clean_special_symbols(text, symbol):
            for ch in ['::', '/','{','}','[',']','(',')','#','+','!',';',',','"','\'','@','`','$','^','&','|','\n']:
                if ch in text:
                    text = text.replace(ch,symbol)
            return re.sub(symbol+"+", symbol, text)

        def key_value_replace(word):
            return ''

        regex = '([A-Za-z0-9_.-]+?)[ ]?[:=][ ]?([A-Za-z0-9_.]+?) '
        if len(self.exp_extract) == '':
            return

        for search_index, unit in enumerate(self.res_search_units):
            string = '\n'.join(self.text_file.lines[unit[0]:unit[1]])
            ts = ''
            # handle key value
            r = parse(self.exp_extract, string)
            if r is not None:
                ts = str(dp(r.named['timestamp'], yearfirst=True))
                msg = r.named['msg'].replace('>','-').replace('<','-')
                msg = self_clean_special_symbols(msg, ' ')
                msg = msg[::-1] # msg reverse avoid dislocation
                for value, key  in re.findall(regex, msg):
                    key = key[::-1]
                    value = value[::-1]
                    if is_float(value):
                        value = float(value)
                        if (value == float('inf')) | (value == float('-inf')):
                            continue
                    elif is_int(value):
                        value = int(value)

                    if key+'_'+type(value).__name__ not in self.res_key_value:
                        self.res_key_value[key+'_'+type(value).__name__] = {'insight_alias': self.name, 'name':key, 'type': type(value).__name__, 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                    self.res_key_value[key+'_'+type(value).__name__]['global_index'].append(unit[0]+self.backward_rows)
                    self.res_key_value[key+'_'+type(value).__name__]['search_index'].append(search_index)
                    self.res_key_value[key+'_'+type(value).__name__]['value'].append(value)
                    self.res_key_value[key+'_'+type(value).__name__]['timestamp'].append(ts)
                residue_mark = re.sub(regex, key_value_replace, msg).strip()
                residue_mark = residue_mark[::-1]
                self.res_residue_marks.append({'global_index':unit[0]+self.backward_rows, 'search_index':search_index, 'value':residue_mark, 'timestamp':ts})

            # handle mark
            if len(re.findall(self.exp_mark['exp'], string, flags=re.IGNORECASE)) > 0:
                if self.exp_mark['name'] not in self.res_mark:
                    self.res_mark[self.exp_mark['name']] = {'insight_alias': self.name, 'name':self.exp_mark['name'], 'type': 'mark', 'global_index':[], 'search_index':[], 'value':[], 'timestamp':[]}
                self.res_mark[self.exp_mark['name']]['global_index'].append(unit[0]+self.backward_rows)
                self.res_mark[self.exp_mark['name']]['search_index'].append(search_index)
                self.res_mark[self.exp_mark['name']]['value'].append(self.exp_mark['color'])
                self.res_mark[self.exp_mark['name']]['timestamp'].append(ts)

    def scroll(self, point):
        self.point = point
        self.display_lines = []
        for index, outlier in enumerate(self.outlier[self.point:self.point+self.range]):
            num = str(self.point + index)
            num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
            self.display_lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+outlier['timestamp']+' '+outlier['type']+' '+outlier['desc']+'</td>')

    def judge_mark_outlier(self, res_residue_marks, mark_timestamp, mark_global_index, mark_search_index):
        special_words = set(['timeout', 'fault', 'error', 'abn', 'shutdown'])
        filter_words = ['db', 'mamp']

        def self_clean_special_symbols(text, symbol):
            for ch in ['.', '_','-']:
                if ch in text:
                    text = text.replace(ch,symbol)
            text = re.sub(r'\d+', '', text)
            return re.sub(symbol+"+", symbol, text)

        def string_filter(df):
            text = self_clean_special_symbols(df['value'], ' ')
            words = []
            for w in text.strip().split(' '):
                w = w.lower()
                if len(w) > 0:
                    if (not w[0].isdigit()) & (w not in filter_words):
                        words.append(w)
                        
            if len(set(words).intersection(special_words)) > 0:
                return False
                    
            if len(words) < 2:
                return True
            
            doc = nlp(' '.join(words))
            pos = [w.pos_ for w in doc]
                
            if len(set(pos).intersection(set(['VERB', 'AUX']))) > 0:
                return False
            else:
                return True

        res_residue_marks = pd.DataFrame(res_residue_marks)
        res_residue_marks = res_residue_marks.loc[(res_residue_marks['timestamp'] < mark_timestamp), :]
        res_residue_marks['is_filter'] = res_residue_marks.apply(string_filter, axis=1)
        res_residue_marks = res_residue_marks.loc[(res_residue_marks['is_filter'] == False), :].reset_index(drop=True)
        
        sentences = list(set(res_residue_marks['value'].values))
        for s in sentences:
            _type = 'Normal'
            y = res_residue_marks.loc[(res_residue_marks['value'] == s), :].reset_index(drop=True)
            y = list(y['search_index'].values)
            indcies = []
            for v in y:
                indcies.append(True if v > mark_search_index * 0.7 else False)
            if (list(set(indcies))[0] == True) & (len(list(set(indcies))) == 1):
                _type = 'Mutation'
                
            if _type == 'Normal':
                res_residue_marks.loc[(res_residue_marks['value'] == s), 'is_filter'] = True

        res_residue_marks = res_residue_marks.loc[(res_residue_marks['is_filter'] == False), :].reset_index(drop=True)
        res_residue_marks = res_residue_marks.drop(columns=['is_filter'])

        res = []
        for item in res_residue_marks.to_dict(orient='records'):
            item['name'] = 'residue'
            item['type'] = 'mark'
            item['abnormal_type'] = 'AbnormalDistrust'
            item['desc'] = item['value']
            item['origin'] = self.text_file.lines[item['global_index']]
            res.append(item)
         
        return res

    def judge_discrete_key_value_outlier(self, key_value, mark_timestamp, mark_global_index, mark_search_index):
        flag = True
        tmp_y = []
        tmp_indcies = []
        for index, t in enumerate(key_value['timestamp']):
            if t < mark_timestamp:
                tmp_y.append(key_value['value'][index])
                tmp_indcies.append(index)
            else:
                break
        y = []
        indcies = []
        for index, v in enumerate(tmp_y):
            if len(v) >= 2:
                if v[0:2] == '0x':
                    y.append(v)
                    indcies.append(tmp_indcies[index])
                elif v[0].isdigit():
                    pass
                else:
                    y.append(v)
                    indcies.append(tmp_indcies[index])
        
        if len(y) < 1:
            flag = False

        if flag:
            _type = 'Normal'
            for t in set(y):
                cindcies = []
                judge = []
                for index, item in enumerate(y):
                    if t == item:
                        cindcies.append(indcies[index])
                        judge.append(True if key_value['search_index'][indcies[index]] > mark_search_index * 0.7 else False)
                        
                if (list(set(judge))[0] == True) & (len(list(set(judge))) == 1):
                    _type = 'AbnormalMutation'
                    break

            if _type != 'Normal':
                return [{'name':key_value['name'], 'type': key_value['type'], 'abnormal_type': _type, 'global_index':key_value['global_index'][cindcies[0]], 
                'search_index':key_value['search_index'][cindcies[0]], 'timestamp':key_value['timestamp'][cindcies[0]], 
                'value': key_value['value'][cindcies[0]], 'desc': key_value['name'] + ': "' + key_value['value'][cindcies[0]] + '" is a mutated state!', 
                'origin': self.text_file.lines[key_value['global_index'][cindcies[0]]]}]
            else:
                return []
        else:
            return []

    def judge_consecutive_key_value_outlier(self, key_value, mark_timestamp, mark_global_index, mark_search_index, res_mark):
        flag = True
        y = []
        global_indcies = []
        timestamps = []
        for index, t in enumerate(key_value['timestamp']):
            if t < mark_timestamp:
                y.append(key_value['value'][index])
                global_indcies.append(key_value['global_index'][index])
                timestamps.append(key_value['timestamp'][index])
            else:
                break

        if (len(y) <= 3) | (len(set(y)) <= 1):
            flag = False

        if flag:
            data = pd.DataFrame(y, columns=['y'])
            signal = np.array([[i] for i in data['y']])
            algo = rpt.Dynp(model="l2", min_size=1, jump=1).fit(signal)
            result = algo.predict(n_bkps=2)

            if result[0] != 1:
                sub_data = data.loc[result[0]-1:result[1], :]
            else:
                sub_data = data.loc[result[0]:result[1], :]

            _type = 'Normal'
            if (result[0:2] == [1,2]) & (len(data) < 7):
                if sub_data['y'].values[0] < sub_data['y'].values[1]:
                    _type = 'AbnormalUp'
                elif sub_data['y'].values[0] > sub_data['y'].values[1]:
                    _type = 'AbnormalDown'
            else:
                upper_boundary = sub_data['y'].values[0]
                lower_boundary = sub_data['y'].values[-1]
                points = []
                for v in sub_data['y'].values[1:-1]:
                    if (v > upper_boundary) & (v >= lower_boundary):
                        if 0.6 * (v - upper_boundary) + upper_boundary < lower_boundary:
                            points.append('AbnormalUp')
                        else:
                            points.append('AbnormalUpPulse')
                        continue

                    if (v < upper_boundary) & (v <= lower_boundary):
                        if 0.4 * (upper_boundary - v) + v > lower_boundary:
                            points.append('AbnormalDown')
                        else:
                            points.append('AbnormalDownPulse')
                        continue

                    if (v > upper_boundary) & (v <= lower_boundary):
                        points.append('AbnormalUp')
                        continue

                    if (v < upper_boundary) & (v >= lower_boundary):
                        points.append('AbnormalDown')
                        continue

                for point in points:
                    if 'Pulse' in point:
                        _type = point
                        break
                    elif 'Abnormal' in point:
                        _type = point

            if _type == 'Normal':
                return []

            
            data = pd.DataFrame(key_value)
            data['full_name'] = 'origin'
            mark = pd.DataFrame(res_mark)
            mark['full_name'] = 'mark'
            data = pd.concat([data, mark]).reset_index(drop=True)
            data = data.sort_values('timestamp', ascending=True).reset_index(drop=True).reset_index()
            data = data.rename(columns={"index": "graph_index"})

            abnormal = {}
            part1 = data.loc[0:len(y), :]
            abnormal[key_value['name']] = json.loads(part1.to_json(orient='records'))
            part2 = data.loc[result[0:2], :].reset_index(drop=True)
            part2['type'] = 'mark'
            part2['name'] = 'AB'
            part2['value'] = '#FFA500'
            abnormal['abnormal'] = json.loads(part2.to_json(orient='records'))
            part3 = data.loc[(data['full_name'] == 'mark'), :].reset_index(drop=True).loc[[0],:]
            abnormal[res_mark['name']] = json.loads(part3.to_json(orient='records'))

            origin = {}
            part1 = data.loc[(data['full_name'] == 'origin'), :].reset_index(drop=True)
            origin[key_value['name']] = json.loads(part1.to_json(orient='records'))
            part2 = data.loc[result[0:2], :].reset_index(drop=True)
            part2['type'] = 'mark'
            part2['name'] = 'AB'
            part2['value'] = '#FFA500'
            origin['abnormal'] = json.loads(part2.to_json(orient='records'))
            part3 = data.loc[(data['full_name'] == 'mark'), :].reset_index(drop=True)
            origin[res_mark['name']] = json.loads(part3.to_json(orient='records'))
            
            ret = {'name':key_value['name'], 'type': key_value['type'], 'abnormal_type': _type, 'global_index': global_indcies[result[0]], 
                'search_index':0, 'timestamp':timestamps[result[0]], 'value':result, 'desc':abnormal, 'origin': origin}
            
            return [ret]
        else:
            return []


class StatisticAtomModel(ListModel):
    async def __init__(self, parent, model, mode='normal'):
        await super().__init__(model['namespace'], mode)
        self.parent = parent

        self.code = ''

        self.statistic_type = 'code'
        self.result = ''
        self.result_type = ''

        self.search_function = self.subscribe_namespace(self.get_search_function_namespace())
        self.__dict__.update(model)
        await self.new_view_object()

    def model(self):
        return {'role_path': self.role_path, 'type': 'statistic', 'namespace': self.namespace, 'identifier': self.identifier, 'desc': self.desc, 'code': self.code, 'result':str(self.result), 'result_type':str(self.result_type)}

    async def listener(self, publish_namespace):
        pass

    async def on_statistic_test(self, sid, model):
        self.__dict__.update(model)

        self.statistic()
        await self.emit('refreshTest', self.model(), namespace=self.namespace)

    def statistic(self):
        self.result = ''
        self.result_type = ''

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


class BatchInsightModel(BatchModel):
    async def __init__(self, text_analysis, mode='normal'):
        await super().__init__(text_analysis.namespace + ns.BATCHINSIGHT, mode)
        self.parent = text_analysis
        self.dir_path = ''
        self.config_path = ''

        self.cluster_num = 'auto'
        self.samples = {}
        self.labels = {}
        self.cluster_tree = {}

        self.files = []
        self.files_index = 0
        self.files_num = 0
        self.result = pd.DataFrame()

        self.is_include_mark = False
        self.is_include_discrete = False
        self.is_include_consecutive = True
        self.is_search_based = False

        self.text_analysis = text_analysis

    def model(self):
        return {'surplus': self.files_num - self.files_index, 'cluster_num': self.cluster_num, 'cluster_tree': self.cluster_tree }

    def preprocess(self, atom):
        features = []
        res_outlier = pd.DataFrame()
        outlier = pd.DataFrame(atom.outlier)
        if self.is_include_mark:
            mark_outlier = outlier.loc[(outlier['abnormal_type'] == 'AbnormalDistrust'), :]
            mark_outlier = mark_outlier.drop_duplicates(['value']).reset_index(drop=True)
            if self.is_search_based:
                mark_outlier['value'] = atom.name + '_' + mark_outlier['value']
            features.extend(list(mark_outlier['value'].values))
            res_outlier = pd.concat([res_outlier, mark_outlier]).reset_index(drop=True)

        if self.is_include_discrete:
            discrete_outlier = outlier.loc[(outlier['abnormal_type'] == 'AbnormalMutation'), :]
            discrete_outlier = discrete_outlier.sort_values('timestamp', ascending=False).reset_index(drop=True)
            # discrete_outlier = discrete_outlier.drop_duplicates(['name']).reset_index(drop=True)
            discrete_outlier['value'] = discrete_outlier['name'] + '_' + discrete_outlier['value']
            if self.is_search_based:
                discrete_outlier['value'] = atom.name + '_' + discrete_outlier['value']
            features.extend(list(discrete_outlier['value'].values))
            res_outlier = pd.concat([res_outlier, discrete_outlier]).reset_index(drop=True)

        if self.is_include_consecutive:
            consecutive_outlier = outlier.loc[(outlier['type'] == 'float'), :].reset_index(drop=True)
            consecutive_outlier['value'] = consecutive_outlier['name'] + '_' + consecutive_outlier['abnormal_type']
            if self.is_search_based:
                consecutive_outlier['value'] = atom.name + '_' + consecutive_outlier['value']
            features.extend(list(consecutive_outlier['value'].values))
            res_outlier = pd.concat([res_outlier, consecutive_outlier]).reset_index(drop=True)

        return list(set(features)), res_outlier

    async def on_get_universal(self, sid, cluster_num):
        return self.universal(cluster_num)

    async def on_get_single_insight(self, sid, file_name):
        return self.single_insight(file_name)

    async def on_cluster(self, sid):
        self.cluster()
        await self.on_refresh('', self.model())

    async def on_polling(self, sid):
        if self.files_index < self.files_num:
            await self.exec_unit(self.files_index, self.files[self.files_index - 1])
            self.files_index = self.files_index + 1 
    
    async def exec(self, model):
        self.__dict__.update(model)
        self.samples = []
        self.result = []
        self.files = iterate_files_in_directory(self.dir_path)
        self.files_index = 1
        self.files_num = len(self.files)
        await self.exec_unit(self.files_index, self.files[self.files_index - 1])

        # for index, path in enumerate():
        #     new_file_namespace = self.text_analysis.file_container.namespace+'/'+createUuid4()
            
        #     tmp_file = await TextFileModel(self.parent.file_container, new_file_namespace, self.dir_path+'\\'+path, 'batch')
        #     await tmp_file.on_load_config('', self.config_path, ['insight'])
        #     self.insight(index, tmp_file)
        #     if len(self.samples) >= self.cluster_num:
        #         await self.on_cluster('')

        #     await tmp_file.on_delete('')
        #     print('Finish :', tmp_file.file_name)

    async def exec_unit(self, index, path):
        new_file_namespace = self.text_analysis.file_container.namespace+'/'+createUuid4()
        
        tmp_file = await TextFileModel(self.parent.file_container, new_file_namespace, self.dir_path+'\\'+path, 'batch')
        await tmp_file.on_load_config('', self.config_path, ['insight'])
        self.insight(index, tmp_file)
        await self.on_cluster('')
        await tmp_file.on_delete('')
    
    def insight(self, index, text_file):
        insight_function = text_file.text_file_function.insight_function
        # item = []
        sample = []
        item = {'index': index, 'filePath':text_file.path, 'configPath':self.config_path, 'fileName': text_file.file_name}
        for insight_namespace in insight_function.models.keys():
            atom = insight_function.models[insight_namespace]
            if len(atom.outlier) == 0:
                continue

            features, res_outlier = self.preprocess(atom)
            # res_outlier['name'] = atom.name
            # processed_outlier = pd.concat([processed_outlier, res_outlier]).reset_index(drop=True)
            sample.extend(features)
        # processed_outlier = processed_outlier.sort_values('timestamp', ascending=False).reset_index(drop=True)
        item['outlier'] = res_outlier
        tmp = {}
        for key in sample:
            tmp[key] = 1
        # item = pd.DataFrame([[1 for _ in range(0, len(item))]], columns=item)
        # self.samples = pd.concat([self.samples, item]).reset_index(drop=True)
        self.samples.append(tmp)
        self.result.append(item)

    def cluster(self):
        samples = pd.DataFrame(self.samples)
        samples = samples.fillna(0)

        self.cluster_tree = {}
        self.cluster_tree = {'namespace': 'Clustering', 'name': 'Clustering', 'check': False, 'children': []}

        if len(samples) < 2:
            return

        self.best_cost(samples)

        for cluster in range(0, max(self.labels)+1):
            node = {'namespace': 'Cluster' + str(cluster), 'name': 'Cluster' + str(cluster), 'check': False, 'children': []}
            for index, label in enumerate(self.labels):
                if label == cluster:
                    file_name = self.result[index]['fileName']
                    node['children'].append({'namespace': file_name, 'name': file_name, 'check': False})

            self.cluster_tree['children'].append(node)

    def best_cost(self, samples):
        # Determine the optimal value of K in K-Means Clustering
        if self.cluster_num == 'auto':
            cost =[]
            for i in range(2, 11):
                if i <= len(samples):
                    kmeans  = KMeans(n_clusters = i, max_iter = 300).fit(samples)
                    labels = kmeans.labels_
                    if len(set(labels)) == 1:
                        self.labels = labels
                        return

                    # calculates squared error
                    # for the clustered points
                    cost.append(silhouette_score(samples, labels, metric = 'euclidean'))
            mv = max(cost)
            index = cost.index(mv)
            kmeans = KMeans(init="random", n_clusters=index+1, max_iter=300)
        else:
            kmeans = KMeans(init="random", n_clusters=int(self.cluster_num), max_iter=300)
        self.labels = kmeans.fit(samples).labels_
        
    def universal(self, cluster_num):
        res = []
        samples = pd.DataFrame(self.samples)
        samples = samples.fillna(0)
        samples['label'] = self.labels
        cluster = samples.loc[(samples['label'] == cluster_num), :].reset_index(drop=True)
        for column in cluster.columns:
            if len(set(cluster.loc[:, column].values)) == 1:
                res.append(column)
        return res

    def single_insight(self, file_name):
        return dict(self.result.loc[(self.result['fileName'] == file_name), :].reset_index(drop=True).loc[0, :])['resOutlier'].to_dict('records')


class BatchStatisticModel(BatchModel):
    async def __init__(self, text_analysis, mode='normal'):
        await super().__init__(text_analysis.namespace + ns.BATCHSTATISTIC, mode)
        self.parent = text_analysis
        self.table = pd.DataFrame()
        self.result = ''
        self.result_type = ''

        self.text_analysis = text_analysis

    def model(self):
        return {'namespace':self.namespace, 'result': str(self.result)}

    async def on_code(self, sid, code):
        self.code(code)
        await self.emit('refreshCode', self.model(), namespace=self.namespace)

    async def exec(self, model):
        self.dir_path = model['dir_path']
        self.config_path = model['config_path']

        self.table = pd.DataFrame()
        self.result = ''
        self.result_type = ''

        for index, path in enumerate(iterate_files_in_directory(self.dir_path)):
            new_file_namespace = self.text_analysis.file_container.namespace+'/'+createUuid4()
            
            tmp_file = await TextFileModel(self.parent.file_container, new_file_namespace, self.dir_path+'\\'+path, 'batch')
            await tmp_file.on_load_all_config('', self.config_path)
            sample = self.statistic(index, tmp_file)
            if self.mode == 'normal':
                await self.on_refresh('', sample)
            await tmp_file.on_delete('')
            print('Finish :', tmp_file.file_name)

    def code(self, code):
        try:
            exec(code)
        except Exception as e:
            self.result = str(e)
            self.result_type = "error"
        self.result_type = type(self.result)

    # @staticmethod
    # async def test(new_file_namespace, path):
    #     print(new_file_namespace, path)
    #     tmp_file = await TextFileModel(self.parent, new_file_namespace, self.dir_path+'\\'+path, 'batch')
    #     await tmp_file.on_load_config('', [self.dir_path+'\\'+path, self.config], ['search', 'statistic'])
    #     sample = self.statistic(tmp_file)
    #     if self.mode == 'normal':
    #         await self.on_refresh('', sample)
    #     await tmp_file.on_delete('')
    #     print('Finish :', tmp_file.file_name)

    def statistic(self, index, text_file):
        statistic_function = text_file.text_file_function.statistic_function
        sample = {'index': index, 'filePath':text_file.path, 'configPath':self.config_path, 'fileName': text_file.file_name}
        for statistic_namespace in statistic_function.models.keys():
            atom = statistic_function.models[statistic_namespace]
            sample[atom.identifier] = atom.result
        self.table = self.table.append(sample, ignore_index=True)
        return sample


class TextFileCompareModel(Model):
    async def __init__(self, text_analysis, mode='normal'):
        await super().__init__(text_analysis.namespace + ns.TEXTFILECOMPARE, mode)
        self.parent = text_analysis
        self.first_file_namespace = ''
        self.second_file_namespace = ''

        self.file_container = self.subscribe_namespace(ns.TEXTANALYSIS + ns.FILECONTAINER)
        self.text_analysis = text_analysis

    def model(self):
        return {'namespace': self.namespace, 'first': self.file_container.text_files[self.first_file_namespace].text_file_original.namespace if self.first_file_namespace != '' else '', 
                'second': self.file_container.text_files[self.second_file_namespace].text_file_original.namespace if self.first_file_namespace != '' else '',
                'files': list(self.file_container.text_files.keys())}

    async def listener(self, subscribe_namespace):
        await self.on_update_dialog('')

    async def on_exec(self, sid, model):
        self.__dict__.update(model)

        first_file, second_file = self.compare()
        await first_file.text_file_function.search_function.on_refresh_roles(sid)
        await second_file.text_file_function.search_function.on_refresh_roles(sid)
        await self.emit('refresh', self.model(), namespace=self.namespace)

    def compare(self):
        def self_clean_special_symbols(text, symbol):
            for ch in [':', '/','{','}','[',']','(',')','#','+','!',';',',','"','\'','@','`','$','^','&','|','-','.','=','\n']:
                if ch in text:
                    text = text.replace(ch,symbol)
            text = re.sub("\d+", '', text)
            return re.sub(symbol+"+", symbol, text).strip()

        first_file = self.file_container.text_files[self.first_file_namespace]
        second_file = self.file_container.text_files[self.second_file_namespace]

        # compare search
        for search_namespace in first_file.text_file_function.search_function.models.keys():
            first_search_namespace = first_file.text_file_function.search_function.namespace + '/' + search_namespace.split('/')[-1]
            second_search_namespace = second_file.text_file_function.search_function.namespace + '/' + search_namespace.split('/')[-1]
            first_search_atom = first_file.text_file_function.search_function.models[first_search_namespace]
            second_search_atom = second_file.text_file_function.search_function.models[second_search_namespace]

            first_clean_lines = []
            for unit in first_search_atom.res_search_units:
                string = '\n'.join(first_file.lines[unit['range'][0]:unit['range'][1]])
                first_clean_lines.append(self_clean_special_symbols(string, ' '))
            first_clean_lines = list(set(first_clean_lines))
            first_search_atom.res_clean_lines = first_clean_lines

            second_clean_lines = []
            for unit in second_search_atom.res_search_units:
                string = '\n'.join(second_file.lines[unit['range'][0]:unit['range'][1]])
                second_clean_lines.append(self_clean_special_symbols(string, ' '))
            second_clean_lines = list(set(second_clean_lines))
            second_search_atom.res_clean_lines = second_clean_lines

            first_special = []
            for search_index, unit in enumerate(first_search_atom.res_search_units):
                string = '\n'.join(first_file.lines[unit['range'][0]:unit['range'][1]])
                if self_clean_special_symbols(string, ' ') not in second_clean_lines:
                    first_special.append({'identifier': first_search_atom.identifier, 'global_index':unit['range'][0], 'search_index': search_index, 'timestamp': unit['timestamp']})

            second_special = []
            for search_index, unit in enumerate(second_search_atom.res_search_units):
                string = '\n'.join(second_file.lines[unit['range'][0]:unit['range'][1]])
                if self_clean_special_symbols(string, ' ') not in first_clean_lines:
                    second_special.append({'identifier': second_search_atom.identifier, 'global_index':unit['range'][0], 'search_index': search_index, 'timestamp': unit['timestamp']})

            first_search_atom.res_compare_special_lines = first_special
            first_search_atom.specials = list(pd.DataFrame(first_special)['global_index'].values) if len(first_special) > 0 else []
            second_search_atom.res_compare_special_lines = second_special
            second_search_atom.specials = list(pd.DataFrame(second_special)['global_index'].values) if len(second_special) > 0 else []
        return first_file, second_file

        # compare chart
        # for identifier in first_file.text_file_function.chart_function.models.keys():
        #     first_chart_atom = first_file.text_file_function.chart_function.models[identifier]
        #     second_chart_atom = second_file.text_file_function.chart_function.models[identifier]


class GlobalChartModel(Model):
    async def __init__(self, text_analysis, mode='normal'):
        await super().__init__(text_analysis.namespace + ns.GLOBALCHART, mode)
        self.parent = text_analysis
        self.key_value_tree = {}
        self.select_lines = {}

        self.file_container = self.subscribe_namespace(ns.TEXTANALYSIS + ns.FILECONTAINER)
        self.text_analysis = text_analysis

    def model(self):
        return {'namespace': self.namespace, 'key_value_tree': self.key_value_tree, 'select_lines':self.select_lines}

    async def listener(self, subscribe_namespace):
        self.generate_global_key_value_tree()
        await self.on_update_dialog('')

    async def on_exec(self, sid, model):
        self.__dict__.update(model)

        self.chart()
        await self.emit('refresh', self.model(), namespace=self.namespace)

    async def on_clear_global_key_value_tree(self, sid):
        self.generate_global_key_value_tree()
        await self.on_update_dialog(sid)

    def chart(self):
        selected_key = {}
        for file in self.key_value_tree['children']:
            for search_atom in file['children']:
                for key in search_atom['children']:
                    if key['check'] == True:
                        # namespace = file['namespace'] + ns.TEXTFILEFUNCTION + ns.SEARCHFUNCTION + '/' + search_atom['namespace']
                        identifier = self.file_container.text_files[file['namespace']].text_file_function.search_function.models[search_atom['namespace']].identifier
                        key_value = self.file_container.text_files[file['namespace']].text_file_function.search_function.models[search_atom['namespace']].res_key_value[key['name']]
                        if len(key_value['global_index']) > 0:
                            selected_key[file['name']+'.'+identifier+'.'+key['name']] = key_value

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

    def generate_global_key_value_tree(self):
        self.key_value_tree = {}
        self.key_value_tree = {'namespace': 'Key Value', 'name': 'Key Value', 'check': False, 'children': []}
        for file_namespace in self.file_container.text_files.keys():

            text_file = self.file_container.text_files[file_namespace]
            key_value_tree = {}
            key_value_tree = {'namespace': text_file.namespace, 'name': text_file.file_name, 'check': False, 'children': []}
            search_function = self.file_container.text_files[file_namespace].text_file_function.search_function
            for namespace in search_function.models.keys():
                keys = []
                for key in search_function.models[namespace].res_key_value.keys():
                    keys.append({'name': key, 'check': False})
                key_value_tree['children'].append({'namespace': namespace, 'name': search_function.models[namespace].identifier, 'check': False, 'children': keys})
            self.key_value_tree['children'].append(key_value_tree)


# from asyncio import ensure_future, gather
# from concurrent.futures import ProcessPoolExecutor, as_completed
# from multiprocessing import freeze_support, current_process, cpu_count, Manager, Process
# from text_analysis import BatchStatisticModel


# class Parallel(object):

#     def __init__(self):
#         self._cpu_count = cpu_count()
#         self.responses = ''
#         # self.smm = SharedMemoryManager()
#         # self.smm.start()

#         self.exe = ProcessPoolExecutor(self._cpu_count)
#         fs = [self.exe.submit(Parallel.work_init, cpu_num) for cpu_num in range(self._cpu_count)]
#         self.container = {}

#     @staticmethod
#     def work_init(cpu_num):
#         print(f'Init Cpu Num:{cpu_num} {current_process()=}')

#     def shutdown(self):
#         self.container = {}

#     def copy_to_shm(self, namespace, data):
#         self.container[namespace] = Manager().list(data)
#         return self.container[namespace]

#     def delete_shm(self, namespace):
#         self.container[namespace] = ''
#         del self.container[namespace]

#     # async def run():
#     # tasks = []
#     # async with ClientSession() as session:
#     #     for i in range(total):
#     #         task = ensure_future(BatchStatisticModel.test('TEST', 'TEST'))
#     #         tasks.append(task)

#     #     self.responses = gather(*tasks)
#     #     await self.responses

#     @staticmethod
#     def exec_loop():
#         loop = get_event_loop()
#         future = ensure_future(BatchStatisticModel.test('TEST', 'TEST'))
#         loop.run_until_complete(future)

#     def parallel(self, models):
#         # processes = []

#         # for namespace in models.keys():
#         #     p = Process(target=models[namespace].search, args=())
#         #     processes.append(p)

#         # [x.start() for x in processes]
#         fs = []
#         ns = list(models.keys())
#         # for namespace in ns:
#         #     fs.append(self.exe.submit(models[namespace].search, namespace))

#         fs = [self.exe.submit(Parallel.exec_loop) for namespace in models.keys()]
#         for data in as_completed(fs):
#             print(data.result())

if __name__ == '__main__':
    # freeze_support()
    # parallel = Parallel()

    loop = get_event_loop()
    loop.run_until_complete(TextAnalysisModel('parallel'))

    web.run_app(app, host="127.0.0.1", port=8000)