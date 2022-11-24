from multiprocessing.shared_memory import SharedMemory
from multiprocessing.managers import SharedMemoryManager
from concurrent.futures import ProcessPoolExecutor, as_completed
from multiprocessing import current_process, cpu_count
from utils import *


def work_init(cpu_num):
    print(f'Init Cpu Num:{cpu_num} {current_process()=}')

def work_extract_inverted_index_table(shm_name, shape, dtype, cpu_n, width):
    print(f'With SharedMemory: {current_process()=}')
    time1 = time.time()
    shm = SharedMemory(shm_name)
    data = np.ndarray(shape, dtype=dtype, buffer=shm.buf)

    inverted_index_table = {}
    base = cpu_n*width
    for index, line in enumerate(data[base : (cpu_n+1)*width]):
        # line = line[0].decode('utf-8')
        for word in set(clean_special_symbols(line,' ').split(' ')):
            word = word.strip()
            if len(word) > 0:
                if not word[0].isdigit():
                    if (word not in inverted_index_table):
                        inverted_index_table[word] = [base + index]
                    else:
                        inverted_index_table[word].append(base + index)
    print('work_extract_inverted_index_table: ', time.time() - time1)
    return inverted_index_table

def work_extract_regex(shm_name, shape, dtype, cpu_n, width, res_search_lines, key_value, key_type, key_name, time_index, regexs):
    def is_type_correct(_type, reg):
        if _type == 'STRING':
            return True, reg
        elif _type == 'INT':
            return True, int(reg)
        elif _type == 'FLOAT':
            return True, float(reg)
        return False, ''

    print(f'With SharedMemory: {current_process()=}')
    time1 = time.time()
    shm = SharedMemory(shm_name)
    data = np.ndarray(shape, dtype=dtype, buffer=shm.buf)
    res_inverted_index_table = {}
    base = cpu_n*width
    for search_index, line in enumerate(res_search_lines[base : (cpu_n+1)*width]):
        for n_regex, regex in enumerate(regexs):
            regex_res = regex.findall(data[line])
            if len(regex_res) > 0:
                regex_res = regex_res[0]
                c_time = regex_res[time_index[n_regex]]
                for index, reg in enumerate(regex_res):
                    flag, value = is_type_correct(key_type[n_regex][index], reg)
                    if flag:
                        key_value[key_name[n_regex][index]].append({'name': key_name[n_regex][index], 'type': key_type[n_regex][index], 'global_index': line, 'search_index': base + search_index, 'value': value, 'timestamp': c_time})
                for word in set(clean_special_symbols(data[line],' ').split(' ')):
                    if len(word) > 0:
                        if not word[0].isdigit():
                            if (word not in res_inverted_index_table):
                                res_inverted_index_table[word] = [{'name':word, 'type': 'word', 'global_index': line, 'search_index':base + search_index, 'value': word, 'timestamp': c_time}]
                            else:
                                res_inverted_index_table[word].append({'name':word, 'type': 'word', 'global_index': line, 'search_index':base + search_index, 'value': word, 'timestamp': c_time})
                break
    print('work_extract_regex: ', time.time() - time1)
    return [key_value, res_inverted_index_table]

class Parallel(object):

    def __init__(self):
        self._cpu_count = cpu_count()

        self.smm = SharedMemoryManager()
        self.smm.start()

        self.exe = ProcessPoolExecutor(self._cpu_count)
        _ = [self.exe.submit(work_init, cpu_num) for cpu_num in range(self._cpu_count)]
        self.container = {}



    def shutdown(self):
        self.smm.shutdown()
        self.container = {}

    def copy_to_shm(self, uid, data):
        self.container[uid] = {'shm':self.smm.SharedMemory(size=data.nbytes), 'shape':data.shape, 'dtype':data.dtype}
        shm_np_array = np.ndarray(data.shape, dtype=data.dtype, buffer=self.container[uid]['shm'].buf)
        shm_np_array[:] = data[:]
        return shm_np_array

    def unlink_shm(self, uid):
        self.container[uid].unlink()
        del self.container[uid]

    def extract_inverted_index_table(self, uid, inverted_index_table):
        start_time = time.time()
        width = int(self.container[uid]['shape'][0] / self._cpu_count) + 1
        fs = [self.exe.submit(work_extract_inverted_index_table, self.container[uid]['shm'].name, self.container[uid]['shape'], self.container[uid]['dtype'], cpu_num, width) for cpu_num in range(self._cpu_count)]
        for _ in as_completed(fs):
            pass
        for core in fs:
            res = core.result()
            for key in res.keys():
                if key not in inverted_index_table:
                    inverted_index_table[key] = res[key]
                else:
                    inverted_index_table[key].extend(res[key])

        # Check memory usage
        print(f'Time elapsed: {time.time()-start_time:.2f}s')

    def extract_regex(self, uid, res_search_lines, key_value, key_type, key_name, time_index, regexs):
        start_time = time.time()
        width = int(len(res_search_lines) / self._cpu_count) + 1
        fs = [self.exe.submit(work_extract_regex, self.container[uid]['shm'].name, self.container[uid]['shape'], self.container[uid]['dtype'], cpu_num, width, res_search_lines, key_value, key_type, key_name, time_index, regexs) for cpu_num in range(self._cpu_count)]
        for _ in as_completed(fs):
            pass

        res_key_value = {}
        res_inverted_index_table = {}
        for core in fs:
            res = core.result()
            for key in res[0].keys():
                if key not in res_key_value:
                    res_key_value[key] = res[0][key]
                else:
                    res_key_value[key].extend(res[0][key])

            for key in res[1].keys():
                if key not in res_inverted_index_table:
                    res_inverted_index_table[key] = res[1][key]
                else:
                    res_inverted_index_table[key].extend(res[1][key])
        print(f'Time elapsed: {time.time()-start_time:.2f}s')
        return res_key_value, res_inverted_index_table
