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

def analysis_mlog(lines):
    data = {}
    flag = False
    table = []
    for line in lines:
        try:
            line = line.decode("utf-8")
            if flag:
                if line[0] == '=':
                    break
                table.append(line)

            if ('lhlist' in line) & ('lhsh' in line) & ('coli>' in line): 
                flag = True
        except Exception as e:
            print(e)
    
    regex_title = "^(.*?): (.*?)  +(.*?)  +(.*?)  +(.*?)  +(.*?)  +(.*?)$"
    regex_item = "^(.*?): (.*?)  +(.*?)  +(.*?)  +(.*?)  +(.*?)  +(.*?)  +"
    if len(table) > 1:
        title = re.findall(regex_title, table[0])
        if title != []:
            for item in table[1:]:
                res = re.findall(regex_item, item)
                if res != []:
                    data[res[0][1]] = dict(zip(title[0], res[0]))
    return data

def take_apart_dcgm(dcgm_dir_path, save_path, telog_filters, elog_filters):
    for num, filename in enumerate(iterate_files_in_directory(dcgm_dir_path)):
        print(num, filename)
        dcgm_path = dcgm_dir_path + filename
        telog_name = 'teread.log'
        if '.zip' in filename:
            with zipfile.ZipFile(dcgm_path, 'r') as outer:
                telog = ''
                elog = ''
                mlog = ''
                telog_data = {}
                elog_data = {}
                mlog_data = {}
                for file in outer.filelist:
                    if '_logfiles.zip' in file.filename:
                        telog = file.filename
                    if '_dcg_e2.log.gz' in file.filename:
                        elog = file.filename
                    if '_dcg_m.log.gz' in file.filename:
                        mlog = file.filename
                
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

                if mlog != '':
                    with outer.open(mlog, 'r') as nest:
                        zfile = io.BytesIO(nest.read())
                        lines = gzip.open(zfile, 'r')
                        mlog_data = analysis_mlog(lines)
                    
            if (telog_filters == []) & (elog_filters == []):
                for dev in telog_data.keys():
                    dev_name = clean_special_symbols(dev,'_')
                    if dev in mlog_data:
                        with open(save_path+mlog_data[dev]['SERIAL']+'_'+telog.replace('_logfiles.zip', '')+'_'+dev_name+'_telog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(telog_data[dev]))
                    else:
                        with open(save_path+telog.replace('_logfiles.zip', '')+'_'+dev_name+'_telog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(telog_data[dev]))

                for dev in elog_data.keys():
                    dev_name = clean_special_symbols(dev,'_')
                    if dev in mlog_data:
                        with open(save_path+mlog_data[dev]['SERIAL']+'_'+elog.replace('_dcg_e2.log.gz', '')+'_'+dev_name+'_elog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(elog_data[dev]))
                    else:
                        with open(save_path+elog.replace('_dcg_e2.log.gz', '')+'_'+dev_name+'_elog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(elog_data[dev]))
            else:
                for dev in set(telog_data.keys()).intersection(set(elog_data.keys())):
                    dev_name = clean_special_symbols(dev,'_')
                    if dev in mlog_data:
                        with open(save_path+mlog_data[dev]['SERIAL']+'_'+telog.replace('_logfiles.zip', '')+'_'+dev_name+'_telog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(telog_data[dev]))
                            
                        with open(save_path+mlog_data[dev]['SERIAL']+'_'+elog.replace('_dcg_e2.log.gz', '')+'_'+dev_name+'_elog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(elog_data[dev]))
                    else:
                        with open(save_path+telog.replace('_logfiles.zip', '')+'_'+dev_name+'_telog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(telog_data[dev]))
                            
                        with open(save_path+elog.replace('_dcg_e2.log.gz', '')+'_'+dev_name+'_elog.log', 'w', encoding='utf-8') as f:
                            f.write(''.join(elog_data[dev]))