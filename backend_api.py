
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


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "running", "message": "AI Shopping Assistant API is running"}


@app.post("/analyze", response_model=QueryResponse)
async def analyze_product(request: QueryRequest):
    """
    Analyze product data and answer user's question.

    Args:
        request: QueryRequest containing product data and user question

    Returns:
        QueryResponse with AI-generated answer and product summary
    """
    try:
        # Initialize LLM
        llm = get_llm()

        # Format features as bullet points
        features_text = "\n".join([f"  - {feature}" for feature in request.product_data.features]) if request.product_data.features else "  - No specific features listed"

        # Create prompt
        prompt = PRODUCT_ANALYSIS_PROMPT.format(
            site=request.product_data.site,
            title=request.product_data.title,
            price=request.product_data.price,
            rating=request.product_data.rating,
            review_count=request.product_data.review_count,
            availability=request.product_data.availability,
            category=request.product_data.category,
            features=features_text,
            description=request.product_data.description or "No detailed description available",
            question=request.question
        )

        # Get LLM response
        response = llm.invoke(prompt)

        # Create product summary
        summary = f"{request.product_data.title}"
        if request.product_data.price:
            summary += f" - {request.product_data.price}"
        if request.product_data.rating:
            summary += f" ({request.product_data.rating}/5 stars)"

        return QueryResponse(
            answer=response.content,
            product_summary=summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare")
async def compare_products(products: List[ProductData], question: str):
    """
    Compare multiple products and provide recommendation.

    Args:
        products: List of product data to compare
        question: User's comparison question

    Returns:
        Comparison analysis and recommendation
    """
    try:
        llm = get_llm()

        # Format products for prompt
        products_text = "\n\n".join([
            f"Product {i+1}:\n- Title: {p.title}\n- Price: {p.price}\n- Rating: {p.rating}/5 ({p.review_count} reviews)\n- Features: {', '.join(p.features[:3]) if p.features else 'N/A'}"
            for i, p in enumerate(products)
        ])

        comparison_prompt = f"""Compare these products and answer the user's question.

{products_text}

User Question: {question}

Provide a clear comparison and recommendation:"""

        response = llm.invoke(comparison_prompt)

        return {"comparison": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


if __name__ == "__main__":
    # Run the server
    print("Starting AI Shopping Assistant API server...")
    print("Server running at http://localhost:5000")
    print("Press Ctrl+C to stop")

    uvicorn.run(
        "backend_api:app",
        host="0.0.0.0",
        port=5000,
        reload=True  # Auto-reload during development
    )

