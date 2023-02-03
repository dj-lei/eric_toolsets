import asyncio
import socket_server
from aiohttp import web
from text_analysis import TextAnalysisModel
from concurrent.futures import ProcessPoolExecutor, as_completed
from multiprocessing import freeze_support, current_process, cpu_count, Manager, Process



class Parallel(object):

    def __init__(self):
        self._cpu_count = cpu_count()

        # self.smm = SharedMemoryManager()
        # self.smm.start()

        # self.exe = ProcessPoolExecutor(self._cpu_count)
        # fs = [self.exe.submit(self.work_init, cpu_num) for cpu_num in range(self._cpu_count)]
        self.container = {}

    def work_init(self, cpu_num):
        print(f'Init Cpu Num:{cpu_num} {current_process()=}')

    def shutdown(self):
        self.container = {}

    def copy_to_shm(self, uid, data):
        self.container[uid] = Manager().list(data)
        return self.container[uid]

    def delete_shm(self, uid):
        self.container[uid] = ''
        del self.container[uid]

    def parallel(self, models):
        processes = []

        for namespace in models.keys():
            p = Process(target=models[namespace].search, args=())
            processes.append(p)

        [x.start() for x in processes]
        # fs = []
        # ns = list(models.keys())
        # print(ns)
        # # for namespace in ns:
        # #     fs.append(self.exe.submit(models[namespace].search, namespace))

        # _ = [self.exe.submit(models[namespace].search) for namespace in models.keys()]
        # for _ in as_completed(fs):
        #     print('ffinnnnnnnnnnnnnnnnnnnnnn')


if __name__ == '__main__':
    freeze_support()
    parallel = Parallel()

    loop = asyncio.get_event_loop()
    loop.run_until_complete(TextAnalysisModel(parallel))

    web.run_app(socket_server.app, host="127.0.0.1", port=8000)