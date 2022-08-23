from asyncio.windows_events import NULL
import os.path
import sys
sys.path.append(os.path.abspath('../'))
from config import DB, DB, REVIEW_COLLECTION, ARTICLE_COLLECTION, DICT_COLLECTION
import time
from pymongo import UpdateOne



key = "29c2de4861c643308f53b806c94a39ed"
endpoint = "https://skfhtextanalysis.cognitiveservices.azure.com/"

from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

# Authenticate the client using your key and endpoint 
def authenticate_client():
    ta_credential = AzureKeyCredential(key)
    text_analytics_client = TextAnalyticsClient(
            endpoint=endpoint, 
            credential=ta_credential,
            default_language= 'zh-TW') 
    return text_analytics_client

client = authenticate_client()

# Example function for detecting sentiment in text
def sentiment_analysis_example(documents,client):

    response = client.analyze_sentiment(documents=documents)[0]
    print(response)
    article = response.confidence_scores
    sent_list = [article.positive,article.neutral,article.negative]
    sent_index = sent_list.index(max(sent_list))
    if(sent_index==0):
        sent ='positive'
    elif(sent_index ==1):
        sent = 'neutral'
    else:
        sent = 'negative'
    
    sentence_list =[]
    for idx, sentence in enumerate(response.sentences):
        result ={
            "sentence" : sentence.text,
            'sent':sentence.sentiment
        }
        sentence_list.append(result)
        
    return sent ,sentence_list

def sentiment_review(documents,client):
    sentList = []
    responses = client.analyze_sentiment(documents=documents)
    for response in responses: 
        article = response.confidence_scores
        sent_list = [article.positive,article.neutral,article.negative]
        sent_index = sent_list.index(max(sent_list))
        if(sent_index==0):
            sent ='positive'
        elif(sent_index ==1):
            sent = 'neutral'
        else:
            sent = 'negative'
        sentList.append(sent)
    
    return sentList

allData = list(DB[REVIEW_COLLECTION].find({"sent":None},{"_id": 1, "cmtContent": 1}))
print(len(allData))
updates = []
temp = []
id = []
for index,data in enumerate(allData):

    temp.append(data['cmtContent'])
    id.append(data['_id'])
    if((index+1) % 10 == 0):
        sent = sentiment_review(temp,client)
        
        for i in range(0,10):
            updates.append(UpdateOne({'_id': id[i]}, {
                        '$set': {'sent':sent[i]}}, upsert=True))
        temp = []
        id = []

    if ((index+1) % 1000) == 0:
        print(index+1)
        print("STARE WRITE")
        DB[REVIEW_COLLECTION].bulk_write(updates)
        print("AFTER WRITE")
        updates = []
        print("CLEAN THE UPDATES")
        time.sleep(5)
        
        
    
    # print(index)

DB[REVIEW_COLLECTION].bulk_write(updates)
print("AFTER WRITE")
# print("--- %s seconds ---" % (time.time() - start_time))