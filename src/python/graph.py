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
        self.elements = []
        self.type = self.__class__.__name__
        self.filter = ['x','y','r','api','filter']

    def get_linear_scale(self, start_x, end_x, pixel_width):
        self.start_x = start_x
        self.end_x = end_x
        self.pixel_width = pixel_width
        return linear_scale([self.start_x, self.end_x], [0, self.pixel_width])
    
    def get_vars(self):
        variables = dir(self)
        filtered_vars = {}
        for var in variables:
            if not var.startswith('__') and not callable(getattr(self, var)):
                value = getattr(self, var)
                if isinstance(value, (str, int, float, dict, list, tuple, bool)):
                    filtered_vars[var] = value
        return filtered_vars

class LineStory(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter, x_name, count):
        super().__init__()
        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['LineStory']
        self.elements = elements
        self.x_name = x_name
        self.count = count
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.map_locate(self.elements, global_inter)

    def map_locate(self, elements, global_inter):
        for key in elements['top_triangles'].keys():
            for dot in elements['top_triangles'][key]:
                dot['x'] = self.inter(global_inter(dot[self.x_name]))
                dot['filter'] = self.filter
        
        for key in elements['bottom_triangles'].keys():
            for dot in elements['bottom_triangles'][key]:
                dot['x'] = self.inter(global_inter(dot['timestamp']))
                dot['filter'] = self.filter

class LineChart(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter, x_name):
        super().__init__()
        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['LineChart']
        self.elements = elements
        self.x_name = x_name
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.map_locate(self.elements, global_inter)

    def map_locate(self, elements, global_inter):
        for key in elements.keys():
            for dot in elements[key]:
                dot['x'] = self.inter(global_inter(dot[self.x_name]))
                dot['filter'] = self.filter

class ScatterPlot(Glyph):
    def __init__(self, id, start_x, end_x, width, elements, global_inter, r, x_name):
        super().__init__()
        self.id = id
        self.r = r
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = graphs_height['ScatterPlot']
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.elements = elements
        self.x_name = x_name
        self.map_locate(self.elements, global_inter)

    def map_locate(self, elements, global_inter):
        for dot in elements:
            dot['x'] = self.inter(global_inter(dot[self.x_name]))
            dot['r'] = self.r
            dot['filter'] = self.filter

class TidyTree(Glyph):
    def __init__(self, id, elements):
        super().__init__()
        self.id = id
        self.elements = elements

class IndentedTree(Glyph, Tree):
    def __init__(self, id, start_x, end_x, width, elements, global_inter):
        Glyph.__init__(self)
        Tree.__init__(self)
        self.common_height = 20
        self.interval_height = 15

        self.id = id
        self.start_x = start_x
        self.end_x = end_x
        self.width = width
        self.height = 0
        self.inter = self.get_linear_scale(self.start_x, self.end_x, self.width)
        self.elements_to_tree(elements)
        self.map_locate(global_inter)
        self.elements = convert_dict_format(self.to_dict(sort=False, with_data=True))
        
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
                res.append({'id': node['id'], 'start_x': 0, 'end_x': 0, 'elements': None})
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
                node['sx'] = - (self.depth() - len(node['id'].split('.')) + 1) * 50
                node['ex'] = 0
                node['width'] = 0
                node['height'] = self.common_height
                self.height  = self.height  + self.common_height + self.interval_height
            else:
                node['sx'] = self.inter(global_inter(node['start_x']))
                node['ex'] = self.inter(global_inter(node['end_x']))
                node['width'] = node['ex'] - node['sx']
                node['height'] = graphs_height[node['graph_type']]
                self.height  = self.height + graphs_height[node['graph_type']] + self.interval_height
            self.update_node(node["id"], data=node)