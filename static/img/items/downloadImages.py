import json
import requests
import os
from urllib.parse import urlparse

response = requests.get('https://raw.githubusercontent.com/olijeffers0n/RustItems/master/data/items.json')
data = response.json()
for category in data:
    print("Downloading",category)
    for item in data[category]:
        url = item["image"]
        filename = os.path.basename(urlparse(url).path)
        img_data = requests.get(url).content
        with open(filename, 'wb') as handler:
            handler.write(img_data)
        print("downloaded",filename)