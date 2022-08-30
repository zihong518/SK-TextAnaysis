



import urllib.request as req
from datetime import datetime
import requests
import bs4
import re
import json
import pymongo
CONNECTION_STRING = 'mongodb://text-analysis:8im5h6bvEZSWW83JoHknWRBAICJuLipgbyxYj8aPB8V4LWacWeo7klrH0TkCsieXTsWN7AVYMYHZFp5OgUhIMg==@text-analysis.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@text-analysis@'  # Prompts user for connection string
DB_NAME = "SK-text-analysis"
REVIEW_COLLECTION = "Review"
ARTICLE_COLLECTION = "Article"
DICT_COLLECTION = "Dict"
    
DB = pymongo.MongoClient(CONNECTION_STRING)[DB_NAME]

bank_list = {
	"新光":'495872725',
	"國泰":"373500505",
    "iLeo":"1446229166",
    "KoKo":"905157314",
	'台新':"388917170",
	'Richart':'1079733142',
    '永豐':'393497156',
	'DAWHO':'1494273814',
}

def subSentence(x):
    value = re.sub('[^\u4e00-\u9fa5a-zA-Z]+', '',
                   re.sub('http(s)?[-://A-Za-z0-9\\.?=/s_&]+', '', x))
    return value
for bank in bank_list:
    results=[]
    for page in range(1,11):
        url = f"https://itunes.apple.com/rss/customerreviews/page={page}/id={bank_list[bank]}/sortby=mostrecent/json?l=en&&cc=tw"
        request = req.Request(url) 
        with req.urlopen(request) as response:
            data=response.read()

        data=json.loads(data)
        reviews = data['feed']['entry']
        
        for review in reviews:
            date = review['updated']['label']
            date = datetime.strptime(date,"%Y-%m-%dT%H:%M:%S-07:00")
            compare_date = datetime(2021, 1, 1)
            if(date<compare_date):
                continue
            content = review['content']['label']
            date = datetime.strftime(date,"%Y/%m/%d")
            
            result={
				"artDate": date,
				"artCat": bank,
				"origin_sentence": content,
				"sentence":subSentence(content),
				"source":"app store"
			}

            results.append(result)
    
    print("START WRITE")
    DB[ARTICLE_COLLECTION].insert_many(results)
    print("FINISH WRITE")   
    