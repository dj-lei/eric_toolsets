from multiprocessing.shared_memory import SharedMemory
from multiprocessing.managers import SharedMemoryManager
from concurrent.futures import ProcessPoolExecutor, as_completed
from multiprocessing import current_process, cpu_count
from utils import *


def work_extract_inverted_index_table(shm_name, shape, dtype, cpu_n, width):
    print(f'With SharedMemory: {current_process()=}')
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
    return inverted_index_table


class Parallel(object):

    def __init__(self):
        self.smm = SharedMemoryManager()
        self.smm.start()
        self.container = {}

    def shutdown(self):
        self.smm.shutdown()

    def copy_to_shm(self, uid, data):
        self.container[uid] = {'shm':self.smm.SharedMemory(size=data.nbytes), 'shape':data.shape, 'dtype':data.dtype}
        shm_np_array = np.ndarray(data.shape, dtype=data.dtype, buffer=self.container[uid]['shm'].buf)
        np.copyto(shm_np_array, data)

    def unlink_shm(self, uid):
        self.container[uid].unlink()

    def extract_inverted_index_table(self, uid, inverted_index_table):
        start_time = time.time()
        _cpu_count = 8 # cpu_count
        width = int(self.container[uid]['shape'][0] / _cpu_count) + 1
        with ProcessPoolExecutor(_cpu_count) as exe:
            fs = [exe.submit(work_extract_inverted_index_table, self.container[uid]['shm'].name, self.container[uid]['shape'], self.container[uid]['dtype'], cpu_num, width) for cpu_num in range(_cpu_count)]
            for core in as_completed(fs):
                res = core.result()
                for key in res.keys():
                    if key not in inverted_index_table:
                        inverted_index_table[key] = res[key]
                    else:
                        inverted_index_table[key].extend(res[key])
        # Check memory usage
        print(f'Time elapsed: {time.time()-start_time:.2f}s')

    # def extract(self, lines):
    #     df = pd.DataFrame(lines, columns=['log'])
    #     # Convert into numpy recarray to preserve the dtypes
    #     np_array = df.to_records(index=False, column_dtypes={'log': 'S200'})
    #     del df
    #     shape, dtype = np_array.shape, np_array.dtype
    #     print(f"np_array's size={np_array.nbytes/1e6}MB")

    #     # With shared memory
    #     # Start tracking memory usage
    #     _cpu_count = 8 #cpu_count()
    #     with SharedMemoryManager() as smm:
    #         # Create a shared memory of size np_arry.nbytes
    #         shm = smm.SharedMemory(np_array.nbytes)
    #         # Create a np.recarray using the buffer of shm
    #         shm_np_array = np.recarray(shape=shape, dtype=dtype, buf=shm.buf)
    #         # Copy the data into the shared memory
    #         np.copyto(shm_np_array, np_array)
    #         width = int(len(np_array) / _cpu_count)
    #         # Spawn some processes to do some work
    #         start_time = time.time()
    #         with ProcessPoolExecutor(_cpu_count) as exe:
    #             fs = [exe.submit(work_with_shared_memory, shm.name, shape, dtype, cpu_num, width) for cpu_num in range(_cpu_count)]
    #             for _ in as_completed(fs):
    #                 pass
    #     # Check memory usage
    #     print(f'Time elapsed: {time.time()-start_time:.2f}s')
