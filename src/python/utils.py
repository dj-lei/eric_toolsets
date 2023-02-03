import re
import os
import io
import sys
import time
import json
import uuid
import datetime
import numpy as np
import pandas as pd
import zipfile
import gzip
# from deepdiff import DeepDiff
from tslearn.metrics import lcss_path
from sklearn.preprocessing import minmax_scale
from sklearn.cluster import KMeans
from parse import parse
from datetime import timedelta
from dateutil.parser import parse as dp
from types import SimpleNamespace

def createUuid4():
    return str(uuid.uuid4()).replace('-','')

def json_to_object(json_data):
    return json.loads(json.dumps(json_data), object_hook=lambda d: SimpleNamespace(**d))

def clean_special_symbols(text, symbol):
    for ch in ['/','*','{','}','[',']','(',')','#','+','-','!','=',';',':',',','.','"','\'','>','<','@','`','$','^','&','|','\n']:
        if ch in text:
            text = text.replace(ch,symbol)
    return re.sub(symbol+"+", symbol, text)

def iterate_files_in_directory(directory):
    # iterate over files in
    # that directory
    res = []
    for filename in os.listdir(directory):
        f = os.path.join(directory, filename)
        # checking if it is a file
        if os.path.isfile(f):
            res.append(filename)
    return res

def parse_data_format(df):
    return dp(df['timestamp'], yearfirst=True)

def analysis_express(cmd):
    left_p = []
    res = {}
    for i in range(0, len(cmd)):
        if cmd[i] == '(':
            left_p.append(i)
        if cmd[i] == ')':
            priority = len(left_p)
            exp = cmd[left_p.pop():i+1]
            if priority not in res:
                res[priority] = [exp]
            else:
                res[priority].append(exp)
        res[0] = [cmd]

    priority = list(res.keys())
    priority.reverse()
    exp_res = {}
    for p in priority:
        for exp_index, express in enumerate(res[p]):
            if p + 1 in res:
                for n_index, exp_name in enumerate(res[p+1]):
                    if exp_name in express:
                        express = express.replace(exp_name, '@exp'+str(p+1)+'_'+str(n_index))
                exp_res['@exp'+str(p)+'_'+str(exp_index)] = express
            else:
                exp_res['@exp'+str(p)+'_'+str(exp_index)] = express
    return exp_res
    
def cal_time_difference(start, end):
    return datetime.datetime.strptime(end, "%H:%M:%S") - datetime.datetime.strptime(start, "%H:%M:%S")

def get_points_in_time_range(forward_time, backward_time, data):
        res = []
        for index, timestamp in enumerate(data):
            if (forward_time < timestamp) & (timestamp < backward_time):
                res.append(index)
        return res

def is_float(string):
    try:
        float(string)
        return True
    except ValueError:
        return False

def is_int(string):
    try:
        int(string)
        return True
    except ValueError:
        return False