from utils import *

graphs_height = {
    'LineChart': 200,
    'LineStory': 20,
    'ScatterPlot': 100,
}

def linear_scale(domain, range):
    def scale(x):
        return np.interp(x, domain, range)
    return scale

class Glyph(object):
    def __init__(self):
        self.id = ''
        self.start_x = 0
        self.end_x = 0
        self.pixel_width = 0
        self.inter = ''
        self.filter = ['x','y','r','api','filter']

    def get_linear_scale(self, start_x, end_x, pixel_width):
        self.start_x = start_x
        self.end_x = end_x
        self.pixel_width = pixel_width
        return linear_scale([self.start_x, self.end_x], [0, self.pixel_width])

class LineChart(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter):
        super().__init__()
        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['LineChart']
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.map_locate(elements, global_inter)

    def map_locate(self, elements, global_inter):
        for key in elements.keys():
            for dot in elements[key]:
                dot['x'] = self.inter(global_inter(dot['timestamp']))
                dot['timestamp'] = convert_timestamp_datetime(dot['timestamp'])
                dot['filter'] = self.filter

class LineStory(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter):
        super().__init__()
        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['LineStory']
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.map_locate(elements, global_inter)

    def model(self):
        return {
            'start_x': self.start_x,
            'end_x': self.end_x,
            'width': self.width,
            'height': self.height,
            'top_triangles': self.elements['top_triangles'],
            'bottom_triangles': self.elements['bottom_triangles'],
        }

    def map_locate(self, elements, global_inter):
        for key in elements['top_triangles'].keys():
            for dot in elements['top_triangles'][key]:
                dot['x'] = self.inter(global_inter(dot['timestamp']))
                dot['timestamp'] = convert_timestamp_datetime(dot['timestamp'])
                dot['filter'] = self.filter
        
        for key in elements['bottom_triangles'].keys():
            for dot in elements['bottom_triangles'][key]:
                dot['x'] = self.inter(global_inter(dot['timestamp']))
                dot['timestamp'] = convert_timestamp_datetime(dot['timestamp'])
                dot['filter'] = self.filter

class ScatterPlot(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter):
        super().__init__()
        self.id = id
        self.r = 2
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['ScatterPlot']
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.elements = elements
        self.map_locate(self.elements, global_inter)

    def map_locate(self, elements, global_inter):
        for dot in elements:
            dot['x'] = self.inter(global_inter(dot['timestamp']))
            dot['y'] = random.randint(0, 100)
            dot['r'] = self.r
            dot['filter'] = self.filter
            dot['timestamp'] = convert_timestamp_datetime(dot['timestamp'])

class IndentedTree(Glyph, Tree):
    def __init__(self, id, start_x, end_x, width, elements, global_inter):
        Glyph.__init__(self)
        Tree.__init__(self)
        self.common_height = 20
        self.interval_height = 10

        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = 0
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.elements = elements
        self.elements_to_tree(self.elements)
        self.map_locate(global_inter)
        
    def elements_to_tree(self, elements):
        for element in elements:
            for index, s in enumerate(element['path']):
                parent = '.'.join(element['path'][0:index])
                node = '.'.join(element['path'][0:index+1])
                if not self.contains(node):
                    if parent == '':
                        if not self.contains(parent):
                            self.create_node(node, node, data=None)
                        else:
                            self.create_node(node, parent, data=None)
                    else:
                        self.create_node(node, node, parent=parent, data = element if index == len(element['path']) - 1 else None)

    def dict_to_list(self, data):
        result = []
        for key in data.keys():
            node = {'id': key,  'data':data[key]['data']}
            result.append(node)
            if 'children' in data[key]:
                for child in data[key]['children']:
                    result.extend(self.dict_to_list(child))
        return result
                        
    def get_all_nodes_to_list(self):
        res = []
        for node in self.dict_to_list(self.to_dict(sort=False, with_data=True)):
            if node['data'] is None:
                res.append({'id': node['id'], 'start_timestamp': 0, 'end_timestamp': 0, 'elements': None})
            else:
                node['data']['id'] = node['id']
                res.append(node['data'])
        return res
    
    def map_locate(self, global_inter):
        data_list = self.get_all_nodes_to_list()
        self.height = 0
        for node in data_list:
            node['sy'] = self.height 
            if node['elements'] is None:
                node['sx'] = 0
                node['ex'] = 0
                node['width'] = 0
                node['height'] = self.common_height
                self.height  = self.height  + self.common_height + self.interval_height
            else:
                node['sx'] = self.inter(global_inter(node['start_timestamp']))
                node['ex'] = self.inter(global_inter(node['end_timestamp']))
                node['width'] = node['ex'] - node['sx']
                node['height'] = graphs_height[node['graph_type']]
                self.height  = self.height + graphs_height[node['graph_type']] + self.interval_height
            self.update_node(node["id"], data=node)