
"""Backend API server for AI Shopping Assistant extension."""
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Shopping Assistant API",
    description="Backend API for processing product queries using LLM",
    version="1.0.0"
)

# Configure CORS for extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Extension runs locally, no strict origin check needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


