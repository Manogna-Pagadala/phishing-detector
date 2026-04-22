from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from analyzer import analyze_email

app = FastAPI()

# Allow Chrome extension to talk to our backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailRequest(BaseModel):
    sender: str
    subject: str
    body: str
    links: list[str] = []

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(request: EmailRequest):
    result = analyze_email(
        sender=request.sender,
        subject=request.subject,
        body=request.body,
        links=request.links
    )
    return result