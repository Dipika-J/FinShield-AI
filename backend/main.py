from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "FinShield AI Backend Running"}