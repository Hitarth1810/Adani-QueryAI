import time
import os
from google import genai
from openai import OpenAI
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL, GROQ_API_KEY, GROK_API_KEY

# Gemini models to try in order of preference.
# Each model has its OWN separate free-tier quota, so if one is exhausted,
# the next one likely still has quota remaining.
GEMINI_MODEL_CASCADE = [
    "gemini-2.5-flash",       # Best quality flash model
    "gemini-2.0-flash",       # Previous gen flash
    "gemini-2.0-flash-lite",  # Lighter but separate quota
    "gemini-flash-latest",    # Older but reliable (1.5-flash), separate quota
    "gemini-pro-latest",      # Pro model (1.5-pro), separate quota pool
]

def get_client():
    return genai.Client(api_key=GEMINI_API_KEY)

def generate_with_groq(prompt):
    print("\n🔄 Falling back to Groq API...")
    client = OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    
    # Try current available models
    models = ["llama-3.3-70b-versatile", "llama3-70b-8192"]
    
    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst assistant. Answer questions precisely based ONLY on the context provided. Do NOT make up information."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"⚠️ Groq ({model_name}) failed: {str(e)}")
            continue
    raise Exception("All Groq models failed.")

def generate_with_grok(prompt):
    print("\n🔄 Falling back to xAI (Grok) API...")
    client = OpenAI(
        api_key=GROK_API_KEY,
        base_url="https://api.x.ai/v1",
    )
    
    # Try current available models
    models = ["grok-2", "grok-beta", "grok-2-latest"]
    
    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst assistant."},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"⚠️ xAI ({model_name}) failed: {str(e)}")
            continue
    raise Exception("All xAI models failed.")

def generate_answer(query, context_chunks):
    """
    Unified chat answer generator with multi-provider fallback.
    Order: Gemini (Cascade) -> Groq -> xAI (Grok)
    """
    client = get_client()

    context_text = ""
    for chunk in context_chunks:
        context_text += f"---\nSOURCE {chunk['citation']}:\n{chunk['content']}\n"

    prompt = f"""
You are a professional financial analyst assistant. 
Answer the user's question based ONLY on the provided context.

STRICT RULES:
1. Every fact/number must be cited using the format [pX:chunk_id] from the context.
2. If the data is not present, say exactly: "I'm sorry, but that information is not available in the provided document."
3. Be precise with financial numbers. Use tables if it makes the answer clearer.

CONTEXT:
{context_text}

USER QUESTION:
{query}

ANSWER:
"""

    # 1. Try Gemini Cascade
    if GEMINI_API_KEY:
        for model_name in GEMINI_MODEL_CASCADE:
            for attempt in range(2):  # 2 retries per model
                try:
                    print(f"🤖 Trying Gemini model: {model_name} (attempt {attempt+1})")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    print(f"✅ Success with {model_name}")
                    return response.text
                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in str(e) or "quota" in err_str or "limit" in err_str or "resource_exhausted" in err_str:
                        print(f"⚠️ {model_name} quota hit (attempt {attempt+1}/2). ", end="")
                        if attempt == 0:
                            print("Retrying after delay...")
                            time.sleep(2)
                        else:
                            print(f"Moving to next model...")
                        continue
                    elif "not found" in err_str or "not supported" in err_str or "invalid" in err_str:
                        print(f"⚠️ {model_name} not available, skipping...")
                        break  # Skip to next model
                    else:
                        print(f"⚠️ Gemini Error with {model_name}: {str(e)}")
                        break  # Skip to next model
        
        print("❌ All Gemini models exhausted.")
    else:
        print("⚠️ Gemini API key missing, skipping Gemini models.")

    # 2. Fallback: Groq with a larger, smarter model
    if GROQ_API_KEY and not GROQ_API_KEY.startswith("gsk_placeholder"):
        try:
            return generate_with_groq(prompt)
        except Exception as groq_err:
            print(f"⚠️ Groq fallback failed: {str(groq_err)}")

    # 3. Fallback to xAI (Grok)
    if GROK_API_KEY:
        try:
            return generate_with_grok(prompt)
        except Exception as grok_err:
            print(f"⚠️ xAI fallback failed: {str(grok_err)}")

    return "Error: All LLM providers (Gemini, Groq, xAI) failed or are unconfigured. Please check your API keys."

def generate_chunk_answer(query, chunk):
    """
    Per-chunk answer generator with multi-model Gemini cascade and Groq fallback.
    """
    prompt = f"Query: {query}\nSource: {chunk['content']}\nAnswer based ONLY on source:"

    if GEMINI_API_KEY:
        client = get_client()
        for model_name in GEMINI_MODEL_CASCADE:
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return response.text
                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in str(e) or "quota" in err_str or "limit" in err_str or "resource_exhausted" in err_str:
                        if attempt == 0:
                            time.sleep(2)
                        continue
                    elif "not found" in err_str or "not supported" in err_str or "invalid" in err_str:
                        break
                    else:
                        break

    if GROQ_API_KEY and not GROQ_API_KEY.startswith("gsk_placeholder"):
        try:
            return generate_with_groq(prompt)
        except Exception as groq_err:
            print(f"⚠️ Groq fallback failed: {str(groq_err)}")

    if GROK_API_KEY:
        try:
            return generate_with_grok(prompt)
        except:
            pass

    return "Error: Could not generate answer."
