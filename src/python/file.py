from utils import *
# from parallel import *

# ray.init(ignore_reinit_error=True)
# num_cpus = int(ray.cluster_resources()["CPU"] / 4 * 3)
# cores = []
# for core in range(num_cpus):
#     cores.append(Parallel.remote())

color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class FileContainer(object):
    def __init__(self):
        self.files = {}

    def new(self, path):
        uid = str(uuid.uuid4()).replace('-','')
        self.files[uid] = TextFile(path)
        return uid

    def delete(self, uid):
        del self.files[uid]


class TextFile(object):
    def __init__(self, path):
        self.path = path
        self.filename = path.split('\\')[-1]

        self.inverted_index_table = {}
        self.searchs = {}

        with open(self.path, 'r') as f:
            self.lines = f.readlines()
            self.extract_inverted_index()
            # self.parallel_inverted_index_table()

    def extract_inverted_index(self):
        for index, line in enumerate(self.lines):
            for word in set(clean_special_symbols(line,' ').split(' ')):
                word = word.strip()
                if len(word) > 0:
                    if not word[0].isdigit():
                        if (word not in self.inverted_index_table):
                            self.inverted_index_table[word] = [index]
                        else:
                            self.inverted_index_table[word].append(index)

    def parallel_inverted_index_table(self):
        global cores

        result = []
        width = int(len(self.lines) / len(cores))
        for cpu_n in range(len(cores)):
            result.append(cores[cpu_n].extract.remote(self.lines[cpu_n*width : (cpu_n+1)*width], cpu_n*width, (cpu_n+1)*width))
        tmp = ray.get(result)

        for core in tmp:
            for key in core.keys():
                if key not in self.inverted_index_table:
                    self.inverted_index_table[key] = core[key]
                else:
                    self.inverted_index_table[key].extend(core[key])

    def scroll(self, uid, point, range):
        def word_color_replace(word):
            return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')

        special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
        
        lines = []
        for line in self.lines[point:point+range]:
            if uid == '':
                lines.append('<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
            else:
                reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.searchs[uid].cmd_words)+')'+ '['+'|'.join(special_symbols)+']'
                lines.append('<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, line)+'</td>')
        return lines

    def search(self, desc, exp_search, exp_regex, exp_condition, highlights):
        uid = str(uuid.uuid4()).replace('-','')
        self.searchs[uid] = SearchAtom(self, desc, exp_search, exp_regex, exp_condition, highlights)
        return uid

    def change(self, uid, desc, exp_search, exp_regex, exp_condition, highlights):
        self.searchs[uid].change(desc, exp_search, exp_regex, exp_condition, highlights)

    def sort(self, key_value_select):
        selected_key = {}
        for searchAtom in key_value_select['children']:
            for key in searchAtom['children']:
                if key['check'] == True:
                    data_type = self.searchs[searchAtom['uid']].res_kv[key['name']][0]['type']
                    selected_key[searchAtom['name']+'.'+data_type+'.'+key['name']] = self.searchs[searchAtom['uid']].res_kv[key['name']]
            for highlight in self.searchs[searchAtom['uid']].res_highlights.keys():
                selected_key[searchAtom['name']+'.highlight.'+highlight] = self.searchs[searchAtom['uid']].res_highlights[highlight]

        final = {}
        for key in selected_key.keys():
            tmp = list(selected_key.keys())
            tmp.remove(key)
            res = pd.DataFrame()
            res = res.append(pd.DataFrame(selected_key[key]))
            res['full_name'] = key
            for s_key in tmp:
                temp = pd.DataFrame(selected_key[s_key])
                temp['full_name'] = s_key
                res = res.append(temp).reset_index(drop=True)
            res = res.drop_duplicates(['timestamp'])
            res = res.sort_values('timestamp', ascending=True).reset_index(drop=True)
            res = res.loc[(res['full_name'] == key), :].reset_index()
            res = res.rename(columns={"index": "graph_index"})
            final[key] = json.loads(res.to_json(orient='records'))
        return final


class SearchAtom(object):
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
        
        self.change(desc, exp_search, exp_regex, exp_condition, highlights)

    def scroll(self, point, range):
        regexs = []
        v_regexs = []
        for regex in self.exp_regex:
            v_regex = regex
            for i, r in enumerate(re.findall('%\{.*?\}', regex)):
                regex = regex.replace(r, '(.*?)')
                v_regex = v_regex.replace(r, '<span style="color:'+color[i]+'">'+"\\"+str(i+1)+'</span>')
            regexs.append(regex)
            v_regexs.append(v_regex)

        lines = []
        for line in self.res_search_lines[point:point+range]:
            for n_regex, regex in enumerate(regexs):
                regex_res = re.findall(regex, self.parent.lines[line])
                if len(regex_res) > 0:
                    lines.append('<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(regex, v_regexs[n_regex], self.parent.lines[line]).replace('\\','')+'</td>')
                break
        return lines

    def change(self, desc, exp_search, exp_regex, exp_condition, highlights):
        self.desc = desc

        if self.exp_search != exp_search:
            self.exp_search = exp_search
            self.exp_regex = exp_regex
            self.exp_condition = exp_condition
            self.highlights = highlights
            self.search()
            self.regex()
            self.condition()
            self.highlight()
            return

        if self.exp_regex != exp_regex:
            self.exp_regex = exp_regex
            self.exp_condition = exp_condition
            self.highlights = highlights
            self.regex()
            self.condition()
            self.highlight()
            return

        if self.exp_condition != exp_condition:
            self.exp_condition = exp_condition
            self.highlights = highlights
            self.condition()
            self.highlight()
            return

        if self.highlights != highlights:
            self.highlights = highlights
            self.highlight()
            return

    def search(self):
        if self.exp_search == '':
            self.res_search_lines = [i for i in range(len(self.parent.lines))]
        else:
            self.res_search_lines = self.search_unit(self.exp_search)

    def regex(self):
        def is_type_correct(_type, reg):
            try:
                if _type == 'STRING':
                    return True, reg
                elif _type == 'INT':
                    return True, int(reg)
                elif _type == 'FLOAT':
                    return True, float(reg)
                return False, ''
            except:
                return False, ''

        if len(self.exp_regex) == 0:
            return

        key_value = {}
        key_type = {}
        key_name = {}
        time_index = {}
        regexs = []

        for n_regex, regex in enumerate(self.exp_regex):
            key_type[n_regex] = {}
            key_name[n_regex] = {}
            for index, item in enumerate(re.findall('%\{(.*?)\}', regex)):
                if item.split(':')[0] == 'TIMESTAMP':
                    time_index[n_regex] = index

                if (item.split(':')[0] != 'DROP')&(item.split(':')[0] != 'TIMESTAMP'):
                    key_value[item.split(':')[1]] = []

                key_type[n_regex][index] = item.split(':')[0]
                key_name[n_regex][index] = item.split(':')[1]
                    
            for r in re.findall('%\{.*?\}', regex):
                regex = regex.replace(r, '(.*?)')
            regexs.append(regex)
        
        for search_index, line in enumerate(self.res_search_lines):
            for n_regex, regex in enumerate(regexs):
                regex_res = re.findall(regex, self.parent.lines[line])
                if len(regex_res) > 0:
                    regex_res = regex_res[0]
                    c_time = regex_res[time_index[n_regex]]
                    for index, reg in enumerate(regex_res):
                        flag, value = is_type_correct(key_type[n_regex][index], reg)
                        if flag:
                            key_value[key_name[n_regex][index]].append({'name': key_name[n_regex][index], 'type': key_type[n_regex][index], 'global_index': line, 'search_index': search_index, 'value': value, 'timestamp': c_time})
                    
                    for word in set(clean_special_symbols(self.parent.lines[line],' ').split(' ')):
                        if len(word) > 0:
                            if not word[0].isdigit():
                                if (word not in self.res_inverted_index_table):
                                    self.res_inverted_index_table[word] = [{'name':word, 'type': 'word', 'global_index': line, 'search_index':search_index, 'value': word, 'timestamp': c_time}]
                                else:
                                    self.res_inverted_index_table[word].append({'name':word, 'type': 'word', 'global_index': line, 'search_index':search_index, 'value': word, 'timestamp': c_time})
                    break
        self.res_kv = key_value

    def condition(self):
        for exp in self.exp_condition:
            self.res_condition[exp] = []
            if '@' in exp.lower():
                pass
            elif ((' in ' in exp.lower()) | (' not in ' in exp.lower())):
                pass
            elif(('>' in exp.lower()) | ('<' in exp.lower())):
                if '>' in exp.lower():
                    left_res = self.search_unit(exp.split('>')[0].strip())
                    right_res = self.search_unit(exp.split('>')[1].strip())
                    for l_item in left_res:
                        for r_item in right_res:
                            if l_item > r_item:
                                self.res_condition[exp].append([left_res[0], right_res[0], l_item, r_item])
                elif '<' in exp.lower():
                    left_res = self.search_unit(exp.split('<')[0].strip())
                    right_res = self.search_unit(exp.split('<')[1].strip())
                    for l_item in left_res:
                        for r_item in right_res:
                            if l_item < r_item:
                                self.res_condition[exp].append([left_res[0], right_res[0], l_item, r_item])

    def highlight(self):
        def udpate_value(item, value):
            item['value'] = value
            return item

        res_highlights = {}
        for item in self.highlights:
            for word in item[0].split(','):
                for ii_word in self.res_inverted_index_table.keys():
                    if word.strip().lower() == ii_word.strip().lower():
                        if word.strip().lower() not in res_highlights:
                            res_highlights[word.strip().lower()] = list(map(udpate_value, self.res_inverted_index_table[ii_word], [item[1] for _ in range(len(self.res_inverted_index_table[ii_word]))]))
                        else:
                            res_highlights[word.strip().lower()] = res_highlights[word.strip().lower()].extend(list(map(udpate_value, self.res_inverted_index_table[ii_word], [item[1] for _ in range(len(self.res_inverted_index_table[ii_word]))])))
        self.res_highlights = res_highlights

    def search_unit(self, express):
        exp_res = analysis_express(express)
        retrieval_exp = {}
        for exp in exp_res.keys():
            retrieval_exp[exp] = self.retrieval_words(exp_res[exp], retrieval_exp)

        return sorted(retrieval_exp['@exp0_0'])

    def retrieval_words(self, express, retrieval_exp):
        params = []
        if ('(' in express) & (')' in express):
            express = re.findall('\((.*?)\)', express)[0]
        words = express.strip().split(' ')
        for index, word in enumerate(words):
            if index == 0:
                self.cmd_words.append(word)
                params.append({'operate':'|', 'name':word})
            elif index < len(words)-1:
                if word == '&':
                    self.cmd_words.append(words[index + 1])
                    params.append({'operate':'&', 'name':words[index+1]})
                elif word == '|':
                    self.cmd_words.append(words[index + 1])
                    params.append({'operate':'|', 'name':words[index+1]})
        
        res = set()
        for param in params:
            global_index = set()
            if  param['name'] in retrieval_exp:
                global_index = set(retrieval_exp[param['name']])
            else:
                for keyword in self.parent.inverted_index_table.keys():
                    if keyword.lower() == param['name'].lower():
                        global_index.update(set(self.parent.inverted_index_table[keyword]))

            if param['operate'] == '&':
                res = res.intersection(global_index)
            elif param['operate'] == '|':
                res.update(global_index)
        return list(res)



