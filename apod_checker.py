import requests
from datetime import datetime
import re
import sys

# Configuration
API_KEY = "wxo1oIGfOwD8dTAYb7FmJGnLSdzTFiQ5Qe8wmegA"
API_URL = "https://api.nasa.gov/planetary/apod"
APOD_WEBSITE = "https://apod.nasa.gov/apod/astropix.html"

def scrape_apod_website():
    """Scrape the APOD website directly when API is down."""
    
    print("\nAttempting to fetch image directly from website...")
    
    try:
        # Fetch the APOD webpage
        response = requests.get(APOD_WEBSITE, timeout=10)
        
        if response.status_code == 200:
            html = response.text
            
            # Find the high-resolution image link
            # Pattern: <a href="image/YYMM/filename.jpg"><img src="...">
            match = re.search(r'<a href="(image/\d+/[^"]+\.(jpg|jpeg|png|gif))"[^>]*><img', html, re.IGNORECASE)
            
            if match:
                relative_url = match.group(1)
                image_url = f"https://apod.nasa.gov/apod/{relative_url}"
                
                # Try to extract title from the page
                title_match = re.search(r'<b>\s*([^<]+?)\s*</b>', html)
                title = title_match.group(1).strip() if title_match else "Unknown"
                
                print(f"✓ Found image on website")
                print(f"Title: {title}")
                print(f"URL: {image_url}")
                
                # Download the image
                img_response = requests.get(image_url, timeout=30)
                
                if img_response.status_code == 200:
                    today = datetime.now().strftime("%Y-%m-%d")
                    ext = image_url.split(".")[-1].split("?")[0]
                    filename = f"apod_{today}.{ext}"
                    
                    with open(filename, "wb") as f:
                        f.write(img_response.content)
                    
                    print(f"✓ Image saved as: {filename}")
                    return True
                else:
                    print(f"✗ Failed to download image (Status: {img_response.status_code})")
                    return False
            else:
                print("✗ Could not find image link on webpage")
                return False
        else:
            print(f"✗ Website returned error (Status: {response.status_code})")
            return False
    
    except Exception as e:
        print(f"✗ Website scraping failed: {e}")
        return False

def check_apod():
    """Check if APOD API is responsive and fetch today's image."""
    
    print("Checking NASA APOD API status...")
    
    # Get today's date for filename
    today = datetime.now().strftime("%Y-%m-%d")
    
    try:
        # Make request to APOD API
        response = requests.get(
            API_URL,
            params={"api_key": API_KEY},
            timeout=10
        )
        
        # Check if request was successful
        if response.status_code == 200:
            print("✓ API is RESPONSIVE")
            
            data = response.json()
            
            # Check if it's an image (not a video)
            if data.get("media_type") == "image":
                image_url = data.get("url")
                title = data.get("title", "Unknown")
                
                print(f"\nToday's APOD: {title}")
                print(f"Downloading image from: {image_url}")
                
                # Download the image
                img_response = requests.get(image_url, timeout=30)
                
                if img_response.status_code == 200:
                    # Determine file extension from URL
                    ext = image_url.split(".")[-1].split("?")[0]
                    filename = f"apod_{today}.{ext}"
                    
                    # Save the image
                    with open(filename, "wb") as f:
                        f.write(img_response.content)
                    
                    print(f"✓ Image saved as: {filename}")
                else:
                    print(f"✗ Failed to download image (Status: {img_response.status_code})")
            
            elif data.get("media_type") == "video":
                print(f"\n✓ Today's APOD is a VIDEO, not an image")
                print(f"Title: {data.get('title')}")
                print(f"URL: {data.get('url')}")
            
            else:
                print(f"✗ Unknown media type: {data.get('media_type')}")
        
        elif response.status_code == 503:
            print("✗ API is DOWN (Service Unavailable - 503)")
            print("The service is experiencing an outage as indicated on the website.")
            scrape_apod_website()
        
        else:
            print(f"✗ API returned error (Status code: {response.status_code})")
            print(f"Response: {response.text}")
            scrape_apod_website()
    
    except requests.exceptions.Timeout:
        print("✗ API is DOWN (Request timed out)")
        scrape_apod_website()
    
    except requests.exceptions.ConnectionError:
        print("✗ API is DOWN (Connection error)")
        scrape_apod_website()
    
    except requests.exceptions.RequestException as e:
        print(f"✗ API is DOWN (Request error: {e})")
        scrape_apod_website()
    
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        scrape_apod_website()

if __name__ == "__main__":
    check_apod()
