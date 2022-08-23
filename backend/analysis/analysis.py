from pymongo import UpdateOne
import os.path
import sys
sys.path.append(os.path.abspath('../'))
from gettext import find
import pandas as pd
import numpy as np
import os
import re
import jieba
import jieba.analyse
from datetime import datetime
import time
from config import DB, DB, REVIEW_COLLECTION, ARTICLE_COLLECTION, DICT_COLLECTION
import pymongo



CONNECTION_STRING = 'mongodb://text-analysis:8im5h6bvEZSWW83JoHknWRBAICJuLipgbyxYj8aPB8V4LWacWeo7klrH0TkCsieXTsWN7AVYMYHZFp5OgUhIMg==@text-analysis.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@text-analysis@'  # Prompts user for connection string
DB_NAME = "SK-text-analysis"
REVIEW_COLLECTION = "Review"
ARTICLE_COLLECTION = "Article"
DICT_COLLECTION = "Dict"

DB = pymongo.MongoClient(CONNECTION_STRING)[DB_NAME]


def subSentence(x):
    value = re.sub('[^\u4e00-\u9fa5a-zA-Z]+', '',
                   re.sub('http(s)?[-://A-Za-z0-9\\.?=/s_&]+', '', x))
    return value


def jiebaAddDict():
    user_dict = list(DB[DICT_COLLECTION].find(
        {"type": "user_dict"}))[0]['list']
    for word in user_dict:
        jieba.add_word(word)


def getToken(row, stop_word):
    seg_list = jieba.lcut(row)
    # 篩選不在停用字的字與字元數大於1的字詞
    seg_list = [w.lower()
                for w in seg_list if w not in stop_word and len(w) > 1]
    return seg_list


def sentenceToToken(collection):
    test = list(DB[collection].find({}))
    stop_words = list(DB[DICT_COLLECTION].find(
        {"type": "stop_word"}))[0]['list']
    article = pd.DataFrame(test)
    print(article.head())
    article['word'] = article.sentence.apply(lambda x: getToken(x, stop_words))
    updates = []
    start_time = time.time()
    for index, row in article.iterrows():
        if ((index+1) % 1000) == 0:
            print(index+1)
            print("STARE WRITE")
            DB[collection].bulk_write(updates)
            print("AFTER WRITE")
            updates = []
            print("CLEAN THE UPDATES")
            time.sleep(5)
        updates.append(UpdateOne({'_id': row.get('_id')}, {
                       '$set': {'word': row.get('word')}}, upsert=True))
    DB[collection].bulk_write(updates)
    print("AFTER WRITE")
    print("--- %s seconds ---" % (time.time() - start_time))


def main():
    jiebaAddDict()
    sentenceToToken(ARTICLE_COLLECTION)


if __name__ == '__main__':
    main()