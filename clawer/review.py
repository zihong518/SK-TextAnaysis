import urllib.request as req
import json
import requests
import bs4
import csv
import time
import random
import re
from datetime import datetime
import pandas as pd
import urllib.parse
import getpass
import jieba
import jieba.analyse
import pymongo
from random import randint
import logging
from pymongo import UpdateOne

logging.basicConfig(filename='log.txt', filemode='w',
                    format='[%(asctime)s %(levelname)-8s] %(message)s',
                    datefmt='%Y%m%d %H:%M:%S',
                    )


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

def addToken(x,stop_words):
    x['word'] = getToken(x['sentence'], stop_words)
    return x 

def sentenceToToken(collection_name,data):
    stop_words = list(DB[DICT_COLLECTION].find(
        {"type": "stop_word"}))[0]['list']
    # print("STARE WRITE")
    # DB[collection_name].insert_many(data)
    # print("AFTER WRITE")
    # print("CLEAN THE UPDATES")
    tokenDate = map(lambda x: addToken(x, stop_words), data)
    
    # article = pd.DataFrame(data)
    # article['word'] = article.sentence.apply(lambda x: getToken(x, stop_words))
    updates = []
    start_time = time.time()
    for index,row in enumerate(tokenDate):
        if ((index+1) % 1000) == 0:
            print("STARE WRITE")
            DB[collection_name].bulk_write(updates)
            print("AFTER WRITE")
            updates = []
            print("CLEAN THE UPDATES")
            time.sleep(5)
        updates.append(UpdateOne(row, {
                       '$set': row}, upsert=True))
    DB[collection_name].bulk_write(updates)
    print("AFTER WRITE")
    print("--- %s seconds ---" % (time.time() - start_time))

def getReviewData(push_tags, contents, review_time_str,content):
    index = contents.index(content)
    review_time_origin = review_time_str[index].text.replace(" ", "")
    review_time_origin = '2021/'+review_time_origin
    try:
        review_time = datetime.strptime(
            review_time_origin, '%Y/%m/%d%H:%M'+'\n')
        
        review_time = review_time.strftime("%Y/%m/%d")
    except:
        review_time = review_time_origin
    tag = push_tags[index].text
    cmtContent = contents[index].text.split(':')[1]
    cmtDate = review_time

    return tag, cmtContent, cmtDate

def main():
    jiebaAddDict()
    my_headers = {'cookie': 'over18=1;'}
    articles = []
    reviews = []
    topic = "Bank_Service"
    review_list = list(DB[ARTICLE_COLLECTION].find({"artCat":"Bank_Service" },{"artUrl":1}))
    review = list(DB[REVIEW_COLLECTION].find({"type":"Bank_Service" },{"artUrl":1}))
    review = map(lambda x:x['artUrl'],review)
    review = (list(set(review)))
    print(len(review_list))
    print(len(list(set(review))))
    notYet = [elem['artUrl'] for elem in review_list if elem['artUrl'] not in review ]
    
    for index,review in enumerate( notYet):
        url = review
        time.sleep(random.randint(1, 4))
        resp = requests.get(url, headers=my_headers)
        soup = bs4 . BeautifulSoup(resp.text, 'lxml')
        push_tags = soup.select('span.push-tag')
        contents = soup.select('span.push-content')
        review_time_str = soup.select('span.push-ipdatetime')
        for content in contents:
            try:
                tag, cmtContent, cmtDate = getReviewData(
                    push_tags, contents, review_time_str,content)
            except:
                continue
            review = {
				"artUrl": url,
				"cmtStatus": tag,
				"cmtDate": cmtDate,
				"cmtContent": cmtContent,
				"sentence":subSentence(cmtContent),
				"source" : "PTT",
				"type" : topic
			}
            reviews.append(review)
        
        if (index+1) % 100 == 0:
            print((index+1) / len(review_list))
            print('start write')
            sentenceToToken(REVIEW_COLLECTION,reviews)
            reviews = []
    print((index+1) / len(review_list))   
    print('start write')
    sentenceToToken(REVIEW_COLLECTION,reviews)
    reviews = []


main()