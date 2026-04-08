
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

class ProductData(BaseModel):
    """Product data model from scraped content."""
    site: str
    title: str
    price: str
    rating: str
    review_count: str
    description: str
    features: List[str]
    availability: str
    category: str


class QueryRequest(BaseModel):
    """Request model for product query."""
    product_data: ProductData
    question: str
    url: Optional[str] = ""


class QueryResponse(BaseModel):
    """Response model for product query."""
    answer: str
    product_summary: str


# Initialize LLM
def get_llm():
    """Initialize and return the LLM model."""
    return ChatOpenAI(
        model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
        temperature=0.3
    )


# Prompt template for product analysis
PRODUCT_ANALYSIS_PROMPT = PromptTemplate(
    input_variables=["site", "title", "price", "rating", "review_count", "availability", "category", "features", "description", "question"],
    template="""You are an AI shopping assistant helping users make informed purchase decisions.

PRODUCT INFORMATION:
- Site: {site}
- Title: {title}
- Price: {price}
- Rating: {rating} / 5 stars ({review_count} reviews)
- Availability: {availability}
- Category: {category}

KEY FEATURES:
{features}

DESCRIPTION:
{description}

USER QUESTION: {question}

Provide a helpful, concise answer based on the product information above. If the question cannot be answered from the given data, say so and provide relevant information you do have.

Answer:"""
)


