import re
import io
import os
import time
import json
import zlib
import gzip
import uuid
import base64
import zipfile
import datetime
import numpy as np
import pandas as pd


def clean_special_symbols(text, symbol):
    for ch in ['/','*','{','}','[',']','(',')','#','+','-','!','=',':',',','"','\'','>','<','@','`','$','%','^','&','|']:
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


############################################ Json Compression and Decompression ################################################
def decode_base64_and_inflate(string, isB64decode=False):
    if isB64decode:
        decoded_data = base64.b64decode(string)
    else:
        decoded_data = string
    return zlib.decompress(decoded_data , -15)


def deflate_and_base64_encode(string_val, isB64encode=False):
    zlibbed_str = zlib.compress(string_val)
    compressed_string = zlibbed_str[2:-4]
    if isB64encode:
        return base64.b64encode(compressed_string).decode("utf-8")
    else:
        return compressed_string

def gzip_compress(data):
    return gzip.compress(json.dumps(data).encode('utf8'), 5)

def gzip_decompress(data):
    return json.loads(gzip.decompress(data))