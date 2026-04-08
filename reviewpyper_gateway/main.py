import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.files import router as files_router
from routers.proxy import router as proxy_router

app = FastAPI(title="ReviewPyPer Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files_router)
app.include_router(proxy_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
