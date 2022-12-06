from utils import *
import sys

special_symbols = ['/','\*','\{','\}','\[','\]','\(','\)','#','+','-','!','=',':',',','"','\'','>','<','@','$','%','^','\&','\|',' ']
color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
        '#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class FileContainer(object):
    def __init__(self, parallel):
        self.parallel = parallel
        self.files = {}

    def new(self, path, handle_type):
        uid = str(uuid.uuid4()).replace('-','')
        self.files[uid] = TextFile(self, path, uid, handle_type)
        return uid

    def delete(self, uid):
        if self.files[uid].handle_type == 'parallel':
            self.parallel.delete_shm(uid)
        for search_uid in self.files[uid].searchs.keys():
            self.files[uid].searchs[search_uid] = ''
        self.files[uid].searchs = {}
        self.files[uid] = ''
        del self.files[uid]

    def shutdown(self):
        self.parallel.shutdown()
        self.files = {}


class TextFile(object):
    def __init__(self, parent, path, uid, handle_type='parallel'):
        self.parent = parent
        self.uid = uid
        self.path = path
        self.filename = path.split('\\')[-1]
        self.handle_type = handle_type

        self.inverted_index_table = {}
        self.searchs = {}
        self.lines = []
        with open(self.path, 'r') as f:
            if self.handle_type == 'parallel':
                time1 = time.time()
                # self.lines = self.parent.parallel.copy_to_shm(self.uid, np.array(f.readlines()))
                self.lines = self.parent.parallel.copy_to_shm(self.uid, f.readlines())
                self.parallel_extract_inverted_index_table()
                print('parallel_extract_inverted_index_table: ', time.time() - time1)
            else:
                self.lines = f.readlines()
                self.extract_inverted_index()

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

    def parallel_extract_inverted_index_table(self):
        self.inverted_index_table = self.parent.parallel.extract_inverted_index_table(self.uid)

    def scroll(self, uid, point, range):
        def word_color_replace(word):
            return word.group(0).replace(word.group(1), '<span style="color:'+color[self.searchs[uid].cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
        
        lines = []
        if uid == '':
            for index, line in enumerate(self.lines[point:point+range]):
                num = str(point + index)
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
                lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
        else:
            highlights = pd.DataFrame()
            for highlight in self.searchs[uid].res_highlights.keys():
                highlights = pd.concat([highlights, pd.DataFrame(self.searchs[uid].res_highlights[highlight])])

            for index, line in enumerate(self.lines[point:point+range]):
                num = str(point + index)
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+num+'</td>'
                if len(highlights) > 0:
                    is_exsit = highlights.loc[(highlights['global_index'] == point + index), :]
                    if len(is_exsit) > 0:
                        lines.append(num+'<td style="color:'+is_exsit['value'].values[0]+';white-space:nowrap;font-size:12px;text-align:left">'+line+'</td>')
                        continue

                reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.searchs[uid].cmd_words)+')'+ '['+'|'.join(special_symbols)+']'
                lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, line)+'</td>')
        return lines

    def search(self, search_uid, desc, exp_search, exp_regex, exp_condition, highlights):
        if search_uid == '':
            search_uid = str(uuid.uuid4()).replace('-','')
            self.searchs[search_uid] = SearchAtom(self, desc, exp_search, exp_regex, exp_condition, highlights)
        elif search_uid not in self.searchs:
            self.searchs[search_uid] = SearchAtom(self, desc, exp_search, exp_regex, exp_condition, highlights)
        else:
            self.searchs[search_uid].change(desc, exp_search, exp_regex, exp_condition, highlights)
        return search_uid

    def change(self, search_uid, desc, exp_search, exp_regex, exp_condition, highlights):
        self.searchs[search_uid].change(desc, exp_search, exp_regex, exp_condition, highlights)

    def sort(self, key_value_select):
        uid = str(uuid.uuid4()).replace('-','')
        selected_key = {}
        
        for searchAtom in key_value_select['children']:
            for key in searchAtom['children']:
                if key['check'] == True:
                    if len(self.searchs[searchAtom['uid']].res_kv[key['name']]) > 0:
                        data_type = self.searchs[searchAtom['uid']].res_kv[key['name']][0]['type']
                        selected_key[self.uid+'.'+searchAtom['uid']+'.'+data_type+'.'+key['name']] = self.searchs[searchAtom['uid']].res_kv[key['name']]
                        for highlight in self.searchs[searchAtom['uid']].res_highlights.keys():
                            selected_key[self.uid+'.'+searchAtom['uid']+'.highlight.'+highlight] = self.searchs[searchAtom['uid']].res_highlights[highlight]

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
            res['timestamp'] = res.apply(parse_data_format, axis=1)
            res = res.drop_duplicates(['timestamp'])
            res = res.sort_values('timestamp', ascending=True).reset_index(drop=True)
            res = res.loc[(res['full_name'] == key), :].reset_index()
            res = res.rename(columns={"index": "graph_index"})
            res['file_uid'] = key.split('.')[0]
            res['search_uid'] = key.split('.')[1]
            final[key] = json.loads(res.to_json(orient='records'))
        return uid, final


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
        def word_color_replace(word):
            return word.group(0).replace(word.group(1), '<span style="color:'+color[self.cmd_words.index(word.group(1))]+'">'+word.group(1)+'</span>')
  
        lines = []
        if len(self.exp_regex) == 0:
            for line in self.res_search_lines[point:point+range]:
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+str(line)+'</td>'
                reg = '['+'|'.join(special_symbols)+']' +'('+'|'.join(self.cmd_words)+')'+ '['+'|'.join(special_symbols)+']'
                lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(reg, word_color_replace, self.parent.lines[line])+'</td>')
        else:
            regexs = []
            v_regexs = []
            for regex in self.exp_regex:
                v_regex = regex
                for i, r in enumerate(re.findall('%\{.*?\}', regex)):
                    regex = regex.replace(r, '(.*?)')
                    if r.split(':')[0] == '%{DROP':
                        v_regex = v_regex.replace(r, '<span style="color:#FFFFFF">'+"\\"+str(i+1)+'</span>')
                    else:
                        v_regex = v_regex.replace(r, '<span style="color:'+color[i]+'">'+"\\"+str(i+1)+'</span>')
                regexs.append(regex)
                v_regexs.append(v_regex)

            highlights = pd.DataFrame()
            for highlight in self.res_highlights.keys():
                highlights = pd.concat([highlights, pd.DataFrame(self.res_highlights[highlight])])
            for line in self.res_search_lines[point:point+range]:
                num = '<td style="color:#FFF;background-color:#666666;font-size:10px;">'+str(line)+'</td>'

                if len(highlights) > 0:
                    is_exsit = highlights.loc[(highlights['global_index'] == line), :]
                    if len(is_exsit) > 0:
                        lines.append(num + '<td style="color:'+is_exsit['value'].values[0]+';white-space:nowrap;font-size:12px;text-align:left">'+self.parent.lines[line]+'</td>')
                        continue
                flag = True
                for n_regex, regex in enumerate(regexs):
                    regex_res = re.findall(regex, self.parent.lines[line])
                    if len(regex_res) > 0:
                        lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+re.sub(regex, v_regexs[n_regex], self.parent.lines[line]).replace('\\','')+'</td>')
                        flag = False
                        break

                if flag:
                    lines.append(num + '<td style="color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left">'+self.parent.lines[line]+'</td>')

        return lines

    def change(self, desc, exp_search, exp_regex, exp_condition, highlights):
        self.desc = desc

        self.exp_search = exp_search
        self.exp_regex = exp_regex
        self.exp_condition = exp_condition
        self.highlights = highlights
        self.search()
        if self.parent.handle_type == 'parallel':
            self.parallel_regex()
        else:
            self.regex()
        self.condition()
        self.highlight()
        return

    def search(self):
        if self.exp_search == '':
            self.res_search_lines = [i for i in range(len(self.parent.lines))]
        else:
            self.res_search_lines = self.search_unit(self.exp_search)

    def regex(self):
        def is_type_correct(_type, reg):
            if _type == 'STRING':
                return True, reg
            elif _type == 'INT':
                return True, int(reg)
            elif _type == 'FLOAT':
                return True, float(reg)
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
            # compiled_regex = re.compile(regex, re.IGNORECASE)
            regexs.append(re.compile(regex))
        for search_index, line in enumerate(self.res_search_lines):
            for n_regex, regex in enumerate(regexs):
                regex_res = regex.findall(self.parent.lines[line])
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

    def parallel_regex(self):
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
            # compiled_regex = re.compile(regex, re.IGNORECASE)
            regexs.append(re.compile(regex))

        key_value, self.res_inverted_index_table = self.parent.parent.parallel.extract_regex(self.parent.uid, self.res_search_lines, key_value, key_type, key_name, time_index, regexs)
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
                            res_highlights[word.strip().lower()].extend(list(map(udpate_value, self.res_inverted_index_table[ii_word], [item[1] for _ in range(len(self.res_inverted_index_table[ii_word]))])))
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



