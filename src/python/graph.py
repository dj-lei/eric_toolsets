from utils import *

graphs_height ={
    'LineChart': 200,
    'LineStory': 20,
    'ScatterPlot': 200,
}

def linear_scale(domain, range):
    def scale(x):
        return np.interp(x, domain, range)
    return scale

class Graph(object):
    def __init__(self, pixel_width):
        self.start_x = 0
        self.end_x = 0
        self.pixel_width = pixel_width
        self.inter = ''

class LineChart(Graph):
    def __init__(self, pixel_width):
        super().__init__(pixel_width)

    def calculate_position(self):
        for key in node['data']['select_lines'].keys():
                for dot in node['data']['select_lines'][key]:
                    if align_type == 'timestamp':
                        dot['x'] = inter_local(inter_global(dot['timestamp']))
                    else:
                        dot['x'] = inter_local(inter_global(dot['global_index']))
            node['data']['width'] = node['data']['ex'] - node['data']['sx']
            node['data']['height'] = line_chart_height
            node['data']['line_type'] = line_type
            current_height = current_height + line_chart_height + interval_height
            line_charts.append(node)

class IndentedTree(Graph, Tree):
    def __init__(self, pixel_width):
        Graph.__init__(self, pixel_width)
        self.common_height = 20
        self.interval_height = 10
        
    def list_to_tree(self, items):
        for item in items:
            for index, s in enumerate(item['path']):
                parent = '.'.join(item['path'][0:index])
                node = '.'.join(item['path'][0:index+1])
                if not self.contains(node):
                    if parent == '':
                        if not self.contains(parent):
                            self.create_node(node, node, data=None)
                        else:
                            self.create_node(node, parent, data=None)
                    else:
                        self.create_node(node, node, parent=parent, data = item['data'] if index == len(item['path']) - 1 else None)
                        
    def get_all_nodes_to_list(self):
        res = []
        for node in sorted(self.all_nodes(), key=lambda node: node.identifier):
            if node.data is None:
                res.append({'id': node.identifier, 'start_timestamp': 0, 'end_timestamp': 0, 'elements': None})
            else:
                node.data['id'] = node.identifier
                res.append(node.data)
        return res
    
    def calculate_range(self, data_list):
        start_x = []
        end_x = []
        for node in data_list:
            if node['elements'] is not None:
                start_x.append(node['start_timestamp'])
                end_x.append(node['end_timestamp'])
        self.start_x = min(start_x)
        self.end_x = max(end_x)
    
    def calculate_position(self):
        data_list = self.get_all_nodes_to_list()
        self.calculate_range(data_list)
                
        inter_global = linear_scale([self.start_x, self.end_x], [0, self.pixel_width])
        # define indented tree
        current_height = 0
        for node in data_list:
            node['sy'] = current_height
            if node['elements'] is None:
                node['sx'] = 0
                node['ex'] = 0
                node['height'] = self.common_height
                current_height = current_height + self.common_height + self.interval_height
            else:
                node['sx'] = inter_global(node['start_timestamp'])
                node['ex'] = inter_global(node['end_timestamp'])
                node['height'] = graphs_height[node['graph_type']]
                current_height = current_height + graphs_height[node['graph_type']] + self.interval_height
            self.update_node(node["id"], data=node)