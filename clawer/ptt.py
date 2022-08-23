import urllib.request as req
import json
import requests
import bs4
import csv
import time
import random
import re
from datetime import datetime
import urllib.parse
import getpass
import pymongo
from random import randint
import logging
logging.basicConfig(filename='log.txt', filemode='w',
                    format='[%(asctime)s %(levelname)-8s] %(message)s',
                    datefmt='%Y%m%d %H:%M:%S',
                    )


CONNECTION_STRING = 'mongodb://text-analysis:8im5h6bvEZSWW83JoHknWRBAICJuLipgbyxYj8aPB8V4LWacWeo7klrH0TkCsieXTsWN7AVYMYHZFp5OgUhIMg==@text-analysis.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@text-analysis@'  # Prompts user for connection string
DB_NAME = "SK-text-analysis"
REVIEW_COLLECTION = "Review"
ARTICLE_COLLECTION = "Article"


def insertData(result, collection_name):
    client = pymongo.MongoClient(CONNECTION_STRING)
    collection = client[DB_NAME][collection_name]
    document_id = collection.insert_one(result)
    logging.error("Inserted document with _id {}".format(document_id))


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
    return soup, article, a_content, a_time


def getReviewData(push_tags, contents, review_time_str):
    index = contents.index(content)
    review_time_origin = review_time_str[index].text.replace(" ", "")
    review_time_origin = '2021/'+review_time_origin

    review_time = datetime.strptime(
        review_time_origin, '%Y/%m/%d%H:%M'+'\n')

    tag = push_tags[index].text
    cmtContent = contents[index].text.split(':')[1]
    cmtDate = review_time

    return tag, cmtContent, cmtDate


my_headers = {'cookie': 'over18=1;'}
articles = []
reviews = []
aid = 1
cid = 1
topic = "creditcard"
pageId = 0
# action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)
for page in range(1, 205):
    url = "https://www.ptt.cc/bbs/creditcard/index.html" if not pageId else f"https://www.ptt.cc/bbs/creditcard/index{pageId}.html"
    time.sleep(random.randint(2, 5))
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
        time.sleep(random.randint(1, 3))
        soup, artTitle, sentence, artDate = getArticleData(url)
        article = {
            "artTitle": artTitle,
            "artUrl": url,
            "artDate": artDate,
            "artCat": topic,
            "sentence": sentence,
        }
        articles.append(article)

        if page % 10 == 0:
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=4)
        # insertData(article)
        push_tags = soup.select('span.push-tag')
        contents = soup.select('span.push-content')
        review_time_str = soup.select('span.push-ipdatetime')
        for content in contents:
            tag, cmtDate, cmtContent = getReviewData(
                push_tags, contents, review_time_str)

            review = {
                "artUrl": url,
                "push-tag": tag,
                "cmtDate": cmtDate,
                "cmtContent": cmtContent
            }
            reviews.append(review)


# with open('ptt_留言.csv', 'w', newline='',encoding="utf-8-sig") as csvfile:
# 	fieldnames = ['cid','push_tags','content','datetime','aid']
# 	writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
# 	writer.writeheader()
# 	for review in reviews:
# 		# print(review)
# 		writer.writerow(review)
