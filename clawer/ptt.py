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
        updates.append(UpdateOne({'artUrl': row['artUrl']}, {
                       '$set': row}, upsert=True))
    DB[collection_name].bulk_write(updates)
    print("AFTER WRITE")
    print("--- %s seconds ---" % (time.time() - start_time))
    
    # DB[collection_name].bulk_write(updates)
    # print("AFTER WRITE")
    # print("--- %s seconds ---" % (time.time() - start_time))
    # updates = []
    # start_time = time.time()
    # for index, row in article.iterrows():
    #     if ((index+1) % 1000) == 0:
    #         print("STARE WRITE")
    #         DB[collection_name].bulk_write(updates)
    #         print("AFTER WRITE")
    #         updates = []
    #         print("CLEAN THE UPDATES")
    #         time.sleep(5)
    #     updates.append(UpdateOne({'artUrl': row.get('artUrl')}, {
    #                    '$set': {'word': row.get('word')}}, upsert=True))
    # DB[collection_name].bulk_write(updates)
    # print("AFTER WRITE")
    # print("--- %s seconds ---" % (time.time() - start_time))


def getArticleData(url):
    resp = requests.get(url, headers=my_headers)
    soup = bs4 . BeautifulSoup(resp.text, 'lxml')
    # 標題
    article = soup.select("span.article-meta-value")[2].text
    # 內文處理
    main_container = soup.find(id='main-container')
    all_text = main_container.text
    pre_text = all_text.split('--')[0]
    texts = pre_text.split('\n')
    contents = texts[2:]
    a_content = '\n'.join(contents)
    # 時間處理
    time_str = soup.select("span.article-meta-value")[3].text
    a_time = datetime.strptime(time_str, '%a %b %d %H:%M:%S %Y')
    a_time = a_time.strftime("%Y/%m/%d")
    return soup, article, a_content, a_time


def getReviewData(push_tags, contents, review_time_str):
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


my_headers = {'cookie': 'over18=1;'}
articles = []
reviews = []
aid = 1
cid = 1
topic = "Bank_Service"
pageId = 0
# action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)
for page in range(1, 214):
    try:
        url = f"https://www.ptt.cc/bbs/{topic}/index.html" if not pageId else f"https://www.ptt.cc/bbs/{topic}/index{pageId}.html"
        time.sleep(random.randint(2, 5))
        print(url)
        resp = requests.get(url, headers=my_headers)
        soup = bs4 . BeautifulSoup(resp.text, 'lxml')
        links = soup.select("div.title>a")
        if not pageId:
            lastPage = soup.select(
                "div.btn-group-paging >a:nth-child(2)")[0]['href']
            pageId = re.search(r"\d{1,4}", lastPage).group(0)
        else:
            pageId = int(pageId)-1

        for link in links:
            url = f'https://www.ptt.cc{link["href"]}'
            print(url)
            time.sleep(random.randint(1, 3))
            soup, artTitle, sentence, artDate = getArticleData(url)
            article = {
                "artTitle": artTitle,
                "artUrl": url,
                "artDate": artDate,
                "artCat": topic,
                "origin_sentence": sentence,
                "sentence":subSentence(sentence),
                "source":"PTT"
            }
            
            articles.append(article)

            # insertData(article)
            push_tags = soup.select('span.push-tag')
            contents = soup.select('span.push-content')
            review_time_str = soup.select('span.push-ipdatetime')
            for content in contents:
                tag, cmtContent, cmtDate = getReviewData(
                    push_tags, content, review_time_str)

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
                
        if (page+1) % 10 == 0:
            jiebaAddDict()
            print('start write')
            sentenceToToken(ARTICLE_COLLECTION,articles)
            articles = []
            sentenceToToken(REVIEW_COLLECTION,reviews)
            reviews = []
    except:
        continue
        
        