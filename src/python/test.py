from multiprocessing import Process
from text_analysis import TextFileModel
from utils import *
import asyncio

dir_path = 'D:\\projects\\ericsson_flow\\batch_test'
config = 'D:\\projects\\ericsson_flow\\new_files\\config1.txt'

async def test():
    processes = []
    for path in iterate_files_in_directory(dir_path):
        new_file_namespace = '/'+path.split('\\')[-1]
        tmp_file = await TextFileModel('', new_file_namespace, dir_path+'\\'+path, 'batch')
    #     await tmp_file.on_load_config('', [dir_path+'\\'+path, config], ['search', 'statistic'])
    #     sample = statistic(tmp_file)
        p = Process(target=tmp_file.on_load_config, args=('', [dir_path+'\\'+path, config], ['search', 'statistic'],))
        processes.append(p)
    [await x.start() for x in processes]

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test())