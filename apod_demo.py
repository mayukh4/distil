import requests
from bs4 import BeautifulSoup
from pathlib import Path
from datetime import datetime

def download_apod():
    # Fetch the APOD page
    url = "https://apod.nasa.gov/apod/astropix.html"
    response = requests.get(url)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the image - it's typically in an <img> tag or linked via <a>
    img_tag = soup.find('img')
    if img_tag:
        img_url = img_tag.get('src')
    else:
        # Sometimes the image is linked, not embedded
        img_link = soup.find('a', href=True)
        img_url = img_link['href'] if img_link else None
    
    if not img_url:
        print("Could not find image URL")
        return
    
    # Make it an absolute URL
    if not img_url.startswith('http'):
        img_url = f"https://apod.nasa.gov/apod/{img_url}"
    
    # Download the image
    img_response = requests.get(img_url)
    img_response.raise_for_status()
    
    # Save with date in filename
    date_str = datetime.now().strftime("%Y-%m-%d")
    img_extension = Path(img_url).suffix or '.jpg'
    img_filename = f"apod_{date_str}{img_extension}"
    
    with open(img_filename, 'wb') as f:
        f.write(img_response.content)
    print(f"Image saved as: {img_filename}")
    
    # Extract the explanation
    # The explanation is typically after "Explanation:" in a <b> tag
    explanation = ""
    for b_tag in soup.find_all('b'):
        if 'Explanation:' in b_tag.text:
            # Get the text after this tag
            explanation_text = []
            for sibling in b_tag.next_siblings:
                if sibling.name == 'p' or sibling.name is None:
                    explanation_text.append(str(sibling).strip())
                elif sibling.name == 'center':
                    break
            explanation = ''.join(explanation_text)
            break
    
    if explanation:
        explanation_filename = f"apod_explanation_{date_str}.txt"
        with open(explanation_filename, 'w', encoding='utf-8') as f:
            f.write(explanation)
        print(f"Explanation saved as: {explanation_filename}")
        print(f"\nExplanation:\n{explanation[:200]}...")
    else:
        print("Could not find explanation")

if __name__ == "__main__":
    download_apod()
