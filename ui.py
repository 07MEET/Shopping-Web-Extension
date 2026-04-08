from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import streamlit as st
from langchain_core.prompts import PromptTemplate


# Load environment variables
load_dotenv()
st.set_page_config(
    page_title="Smart Shopping AI Assistant",
    page_icon="🛒",

# Page configuration
    layout="centered"
)

# Custom CSS for styling
st.markdown("""
<style>
.main {
    background-color: #f7f9fc;
}
.title {
    text-align: center;
    font-size: 42px;
    font-weight: 800;
    background: linear-gradient(90deg, #1f4037, #99f2c8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.subtitle {
    text-align: center;
    font-size: 16px;
    color: #555;
    margin-bottom: 30px;
}
.response-box {
    background-color: white;
    padding: 20px;
    border-radius: 12px;
    border-left: 6px solid #1f4037;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
}
.footer {
    text-align: center;
    font-size: 13px;
    color: #888;
    margin-top: 40px;
}
</style>
""", unsafe_allow_html=True)

# Title section
st.markdown('<div class="title">Smart Shopping AI Assistant</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Compare prices • Get product insights • Shop smarter using AI</div>', unsafe_allow_html=True)

# Initialize LLM
model = ChatOpenAI(
    model="gpt-5-mini",
    temperature=0.3
)

# Input area
st.markdown("###  Ask anything about a product")
user_input = st.text_area(
    "Example: Compare prices for iPhone 15.",
    height=120
)

# Button action
if st.button(" Ask AI"):
    if user_input.strip() == "":
        st.warning("⚠ Please enter a query before clicking Ask AI.")
    else:
        with st.spinner(" Smart Shopping AI is thinking..."):
            result = model.invoke(user_input)

        st.markdown("###  AI Recommendation")
        st.markdown(f"""
        <div class="response-box">
            {result.content}
        </div>
        """, unsafe_allow_html=True)

# Footer
st.markdown("""
<div class="footer">
    Built as part of <b>Agile Product Development with DevOps</b><br>
                    Smart Shopping Assistant 
</div>
""", unsafe_allow_html=True)
