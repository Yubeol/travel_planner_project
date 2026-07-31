from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from anthropic import Anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
anthropic_client = Anthropic()
import os
import io, requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 실습용, 나중에 실제 도메인으로 좁히기
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# n8n 프로덕션 Webhook URL
N8N_URL = os.getenv("N8N_URL", "http://host.docker.internal:5678/webhook/menu_ocr")


@app.get("/")
def root():
    return {"message": "menu OCR backend running"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        response = requests.post(
            N8N_URL,
            files={"file": ("menu.jpg", buf, "image/jpeg")},
            timeout=120,
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SummarizeRequest(BaseModel):
    text: str


@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    try:
        if not req.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있어요")

        message = anthropic_client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""다음은 음성에서 받아쓴 텍스트입니다. 이 내용을 요약해주세요.

규칙:
1. 핵심 내용을 3~5개의 간결한 불릿으로 정리
2. 중요한 결정사항이나 할 일이 있으면 별도로 표시
3. 한국어로 응답

받아쓴 텍스트:
{req.text}""",
                }
            ],
        )

        # thinking 블록 건너뛰고 text 블록만 추출
        summary_text = ""
        for block in message.content:
            if block.type == "text":
                summary_text += block.text

        return {"summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "한국어"


@app.post("/translate")
async def translate(req: TranslateRequest):
    try:
        if not req.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있어요")

        message = anthropic_client.messages.create(
            model="claude-sonnet-5",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""다음 텍스트를 {req.target_lang}로 자연스럽게 번역해주세요.

규칙:
1. 번역문만 출력하고 다른 설명은 붙이지 않는다.
2. 원문의 의미와 뉘앙스를 최대한 살린다.

원문:
{req.text}""",
                }
            ],
        )

        translated = ""
        for block in message.content:
            if block.type == "text":
                translated += block.text

        return {"translated": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TranslateSegmentsRequest(BaseModel):
    segments: list
    target_lang: str = "한국어"


@app.post("/translate-segments")
async def translate_segments(req: TranslateSegmentsRequest):
    try:
        numbered = "\n".join([f"{i}. {seg['text']}" for i, seg in enumerate(req.segments)])

        message = anthropic_client.messages.create(
            model="claude-sonnet-5",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"""다음은 번호가 매겨진 문장들입니다. 각 문장을 {req.target_lang}로 번역하세요.

규칙:
1. 반드시 '번호. 번역문' 형식으로, 원래 번호를 그대로 유지한다.
2. 번역문만 출력하고 다른 설명은 붙이지 않는다.
3. 문장 개수와 번호를 원문과 정확히 일치시킨다.

원문:
{numbered}""",
                }
            ],
        )

        raw = ""
        for block in message.content:
            if block.type == "text":
                raw += block.text

        translations = {}
        for line in raw.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            parts = line.split(".", 1)
            if len(parts) == 2 and parts[0].strip().isdigit():
                idx = int(parts[0].strip())
                translations[idx] = parts[1].strip()

        result_segments = []
        for i, seg in enumerate(req.segments):
            result_segments.append({**seg, "translated": translations.get(i, "")})

        return {"segments": result_segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


TRAVEL_N8N_URL = os.getenv("TRAVEL_N8N_URL", "http://host.docker.internal:5678/webhook/travel")


@app.post("/travel")
async def travel(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        response = requests.post(
            TRAVEL_N8N_URL,
            files={"file": ("travel.jpg", buf, "image/jpeg")},
            timeout=120,
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))