import urllib.request

photo_ids = [
    "1556910103-1c02745aae4d",  # Kitchen
    "1600585154340-be6161a56a0c",  # Modern kitchen cooking
    "1556910103-1c02745aae4d",  # Modern home kitchen cooking
]

def verify_url(photo_id):
    url = f"https://images.unsplash.com/photo-{photo_id}?q=80&w=400&auto=format&fit=crop"
    req = urllib.request.Request(
        url, 
        method='HEAD',
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error {photo_id}: {e}")
        return False

for pid in photo_ids:
    res = verify_url(pid)
    print(f"ID: {pid} -> {'OK' if res else 'FAILED'}")
