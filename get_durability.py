import requests
from bs4 import BeautifulSoup
def get_explosives_data(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        div = soup.find('div', {'data-name': 'destroyed-by'})
        table = div.find('table')
        rows = table.find_all('tr',{'data-group': 'explosive'})
        data = []
        for row in rows:
            cells = row.find_all(['td', 'th'])
            row_data = [cell.get_text(strip=True) for cell in cells]
            if row_data:
                data.append(row_data)
        return data
    except:
        return False

url = "https://rustlabs.com/group=build"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')
wrap_div = soup.find('div', id='wrap')
a_tags = wrap_div.find_all('a')
hrefs = [a.get('href') for a in a_tags]

for link in hrefs:
    data = get_explosives_data("https://rustlabs.com" + link)
    print(link)
    if(data):
        for item in data:
            print(item)
    print()