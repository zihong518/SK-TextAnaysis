import pandas as pd
import json
import pymongo
import csv
import re
# review_json = review.to_json(orient='records')
article = pd.read_csv("Article.csv")
article['origin_sentence'] = article['sentence'].astype(str)
article['sentence'] = article['sentence'].astype(str)
article['sentence'] = article.sentence.apply(lambda x: re.sub(
    '[^\u4e00-\u9fa5a-zA-Z]+', '', re.sub('http(s)?[-://A-Za-z0-9\\.?=/s_&]+', '', x)))
import_dict = article.to_dict("record")

# print(len(import_dict))
# # import_a =dict[:80000]
# # import_b = dict[80000:]
# # with open('Reviews.csv', 'r', encoding='utf-8-sig') as f:
# #     a = [{k: v for k, v in row.items()}
# #          for row in csv.DictReader(f, skipinitialspace=True)]

# import_a = import_dict[:50000]
# import_b = import_dict[50000:100000]
# import_c = import_dict[100000:]
# # # with open('article.json', 'w', encoding='utf-8-sig') as f:
# # #     json.dump(review_json, f, ensure_ascii=False, indent=4)


CONNECTION_STRING = 'mongodb://text-analysis:8im5h6bvEZSWW83JoHknWRBAICJuLipgbyxYj8aPB8V4LWacWeo7klrH0TkCsieXTsWN7AVYMYHZFp5OgUhIMg==@text-analysis.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@text-analysis@'  # Prompts user for connection string
DB_NAME = "SK-text-analysis"


client = pymongo.MongoClient(CONNECTION_STRING)
db = client[DB_NAME]
db['Article'].insert_many(import_dict)
