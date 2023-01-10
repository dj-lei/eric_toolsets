from tslearn.metrics import dtw, dtw_path
from tslearn.metrics import lcss, lcss_path


def cal_lcss_path_and_score(s_y1, s_y2):
    path, score = lcss_path(s_y1, s_y2)
    return path, score

def cal_dtw_path_and_score(s_y1, s_y2):
    path, score = dtw_path(s_y1, s_y2)
    return path, score