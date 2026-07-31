import sys
from PIL import Image
import io, requests

# 여행 워크플로우 URL (travel로 변경)
url = "http://127.0.0.1:5678/webhook-test/travel"

# 여행 사진 경로 (랜드마크 사진으로)
image_path = sys.argv[1] if len(sys.argv) > 1 else "./data/에펠탑.jpg"

img = Image.open(image_path).convert("RGB")
buf = io.BytesIO()
img.save(buf, format="JPEG")
buf.seek(0)

response = requests.post(url, files={"file": ("travel.jpg", buf, "image/jpeg")})
print("상태코드:", response.status_code)
print("응답:", response.text)