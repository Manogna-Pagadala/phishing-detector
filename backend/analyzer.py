import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_email(sender: str, subject: str, body: str, links: list[str]) -> dict:
    
    prompt = f"""
    Analyze this email for phishing signals and return a JSON response.
    
    Sender: {sender}
    Subject: {subject}
    Body: {body}
    Links found: {', '.join(links) if links else 'none'}
    
    Check for:
    - Urgency language (act now, within 24 hours, account suspended)
    - Mismatched or suspicious sender domain
    - Requests for personal information or credentials
    - Suspicious links or URL shorteners
    - Too good to be true offers (you got the job, salary $200k etc)
    - Generic greetings with no name
    - Sender using personal email (gmail.com, yahoo.com, hotmail.com) while claiming to be from a company like Google, Amazon, Microsoft etc
    - Mismatch between the company name mentioned in the email and the sender's email domain
    - Grammar issues
    
    Respond ONLY with this JSON, nothing else:
    {{
        "risk_score": <number 0-100>,
        "verdict": "<SAFE or CAUTION or PHISHING>",
        "reasons": ["<reason1>", "<reason2>"],
        "summary": "<one sentence explanation>"
    }}
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        result = response.choices[0].message.content
        # Extract JSON even if model adds extra text around it
        start = result.find('{')
        end = result.rfind('}') + 1
        json_str = result[start:end]
        return json.loads(json_str)
    except Exception as e:
        return {"error": str(e)}