from utils import *

def analysis_telog(lines, filters):
    data = {}
    flag = False
    satisfies = [False for _ in filters]
    device = ''
    for line in lines:
        try:
            line = line.decode("utf-8")
            if ('te log read' in line) & ('lhsh' in line):
                if device != '':
                    if False in satisfies:
                        data[device] = []
                        del data[device]

                flag = True
                device = re.findall('lhsh (.*?)te log read', line)[0].strip()
                data[device] = []
                satisfies = [False for _ in filters]
                    
            if flag:
                for index, f in enumerate(filters):
                    if f in line:
                        satisfies[index] = True
                data[device].append(line)
        except Exception as e:
            print(e)

    if device != '':
        if False in satisfies:
            data[device] = []
            del data[device]
    return data

def analysis_elog(lines, filters):
    data = {}
    flag = False
    satisfies = [False for _ in filters]
    device = ''
    for line in lines:
        try:
            line = line.decode("utf-8")
            if ('dcg run' in line) & ('lhsh' in line):
                if device != '':
                    if False in satisfies:
                        data[device] = []
                        del data[device]
                        
                flag = True
                device = re.findall('lhsh (.*?)dcg run', line)[0].strip()
                data[device] = []
                satisfies = [False for _ in filters]
                    
            if flag:
                for index, f in enumerate(filters):
                    if f in line:
                        satisfies[index] = True
                data[device].append(line)
        except Exception as e:
            print(e)
    if device != '':
        if False in satisfies:
            data[device] = []
            del data[device]
    return data

def take_apart_dcgm(dcgm_dir_path, save_path, telog_filters, elog_filters):
    for num, filename in enumerate(iterate_files_in_directory(dcgm_dir_path)):
        print(num, filename)
        dcgm_path = dcgm_dir_path + filename
        telog_name = 'teread.log'
        with zipfile.ZipFile(dcgm_path, 'r') as outer:
            telog = ''
            elog = ''
            telog_data = {}
            elog_data = {}
            for file in outer.filelist:
                if '_logfiles.zip' in file.filename:
                    telog = file.filename
                if '_dcg_e2.log.gz' in file.filename:
                    elog = file.filename
            
            if telog != '':
                with outer.open(telog, 'r') as nest:
                    zfile = io.BytesIO(nest.read())
                    with zipfile.ZipFile(zfile) as nested_zip:
                        with nested_zip.open(telog_name, 'r') as file:
                            telog_data = analysis_telog(file.readlines(), telog_filters)
            
            if elog != '':
                with outer.open(elog, 'r') as nest:
                    zfile = io.BytesIO(nest.read())
                    lines = gzip.open(zfile, 'r')
                    elog_data = analysis_elog(lines, elog_filters)
                

        for dev in set(telog_data.keys()).intersection(set(elog_data.keys())):
            with open(save_path+telog.replace('_logfiles.zip', '')+'_'+dev+'_telog.log', 'w', encoding='utf-8') as f:
                f.write(''.join(telog_data[dev]))
                
            with open(save_path+elog.replace('_dcg_e2.log.gz', '')+'_'+dev+'_elog.log', 'w', encoding='utf-8') as f:
                f.write(''.join(elog_data[dev]))