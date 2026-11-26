from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import re
from pymongo.database import Database

from app.core.database import get_db
from app.repositories.district import district_repo

router = APIRouter(tags=["Chatbot"])

class ChatContext(BaseModel):
    district_name: Optional[str] = None
    active_tab: Optional[str] = None
    is_guest: Optional[bool] = False

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[ChatContext] = None

# Initialize Gemini only if available, to not break app if missing
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

API_KEY = os.environ.get("GEMINI_API_KEY")
if HAS_GENAI and API_KEY:
    genai.configure(api_key=API_KEY)

SYSTEM_PROMPT_TEMPLATE = """You are the Thermacity AI Assistant, an expert urban heat intelligence copilot for Tamil Nadu, India.
Your core mission is to analyze urban heat island (UHI) dynamics, land surface temperature (LST), vegetation index (NDVI), built-up index (NDBI), and guide users with climate mitigation strategies (Cool Roofs, Urban Forestry, Water Bodies, Reflective Pavements).

--- PLATFORM & DISTRICT KNOWLEDGE BASE ---
{district_data_summary}

--- CURRENT USER SESSION CONTEXT ---
{session_context}

--- BEHAVIOR GUIDELINES ---
1. Provide accurate, practical, and data-driven insights tailored to Tamil Nadu districts.
2. Explain technical terms clearly when asked (LST = Land Surface Temp, NDVI = Vegetation cover [-1 to +1], NDBI = Built-up structures [-1 to +1]).
3. Recommend actionable cooling strategies based on district heat risk profiles (High/Extreme Risk: cool roofs + urban canopy + shading).
4. Guide users on how to use Thermacity: navigate Hotspot Map, simulate interventions in Digital Twin, test XAI Feature Attribution, or post in Community Suggestions.
5. Keep your tone professional, encouraging, and formatted with clean markdown bullet points and bold highlights.
6. If asked about non-urban heat topics (e.g. general sports, pop culture), politely pivot back to Thermacity urban heat analytics.
"""

def generate_domain_fallback(last_prompt: str, context: Optional[ChatContext], districts: list) -> str:
    query = last_prompt.lower().strip()
    
    # 1. Hottest / High risk districts query
    if any(k in query for k in ['hottest', 'hotspot', 'high risk', 'extreme', 'warmest', 'top risk']):
        high_risk = [d for d in districts if d.get('risk_level') in ['High', 'Extreme'] or d.get('lst', 0) >= 36.0]
        if not high_risk:
            high_risk = sorted(districts, key=lambda x: x.get('lst', 0), reverse=True)[:3]
        
        res = "### 🔥 High Thermal Risk Hotspots in Tamil Nadu\n\n"
        res += "Based on satellite thermal observation (LST) and built-up indices (NDBI), the key high-risk urban hotspots are:\n\n"
        for d in high_risk[:5]:
            res += f"- **{d.get('name')}**: LST: **{d.get('lst')}°C** | Heat Risk: **{d.get('risk_level')}** | NDVI: {d.get('ndvi')} (NDBI: {d.get('ndbi')})\n"
        res += "\n💡 **Recommended Action**: Deploy **Cool Roofs** (reflective high-albedo coatings) and target urban canopy expansion to lower surface heat by 2–4°C."
        return res

    # 2. Specific District Inquiry (e.g. Chennai, Madurai, Coimbatore, etc.)
    matched_district = None
    for d in districts:
        if d.get('name', '').lower() in query:
            matched_district = d
            break
            
    if matched_district:
        name = matched_district.get('name')
        lst = matched_district.get('lst')
        ndvi = matched_district.get('ndvi')
        ndbi = matched_district.get('ndbi')
        risk = matched_district.get('risk_level')
        hi = matched_district.get('heat_index')
        
        res = f"### 📍 District Thermal Profile: **{name}**\n\n"
        res += f"- **Land Surface Temperature (LST)**: `{lst}°C`\n"
        res += f"- **Heat Risk Assessment**: `{risk}`\n"
        res += f"- **Normalized Difference Vegetation Index (NDVI)**: `{ndvi}` *(Higher = Greener)*\n"
        res += f"- **Normalized Difference Built-up Index (NDBI)**: `{ndbi}` *(Higher = Dense concrete)*\n"
        if hi:
            res += f"- **Overall Heat Risk Score**: `{hi}/100`\n"
        res += f"\n🎯 **Targeted Mitigation Plan for {name}**:\n"
        if risk in ['High', 'Extreme'] or (lst and lst >= 36):
            res += "1. **Urban Canopy Expansion**: Plant native shade trees (Neem, Pongamia) along arterial roads to counter high NDBI.\n"
            res += "2. **Cool Roof Initiative**: Apply solar reflectance index (SRI >= 78) coatings on residential & industrial rooftops.\n"
            res += "3. **Water Body Rejuvenation**: Restore local retention ponds to encourage evaporative cooling.\n"
        else:
            res += "1. **Preserve Existing Green Belts**: Maintain vegetative buffer zones to keep NDVI stable.\n"
            res += "2. **Permeable Paving**: Use porous pavers in walkways to mitigate runoff and heat retention.\n"
        return res

    # 3. Terminology: LST, NDVI, NDBI
    if any(k in query for k in ['lst', 'ndvi', 'ndbi', 'what is', 'definition', 'mean']):
        return ("### 📊 Understanding Urban Thermal Metrics\n\n"
                "- **LST (Land Surface Temperature)**: The radiant temperature of land surfaces detected by satellite thermal infrared sensors. It directly measures urban heat absorption.\n"
                "- **NDVI (Normalized Difference Vegetation Index)**: Ranges from -1.0 to +1.0. Higher values indicate dense green vegetation which provides natural cooling via evapotranspiration.\n"
                "- **NDBI (Normalized Difference Built-up Index)**: Measures concrete, asphalt, and building density. High NDBI strongly correlates with intense Urban Heat Islands (UHI).\n\n"
                "💡 **Pro Tip**: Use the **Digital Twin Simulator** in Thermacity to test how increasing NDVI (vegetation) reduces LST in real time!")

    # 4. Mitigation & Cooling Interventions
    if any(k in query for k in ['strategy', 'strategies', 'cooling', 'mitigate', 'intervention', 'solution', 'action']):
        return ("### 🌿 Thermacity Recommended Urban Cooling Strategies\n\n"
                "1. **Cool Roof Coating**: Reflects up to 80% of solar radiation. Reduces indoor temperature by 2–5°C and cuts AC energy loads.\n"
                "2. **Urban Miyawaki Forests**: Dense native micro-forests planted in dense urban sectors rapidly boost local NDVI and shade pavements.\n"
                "3. **Blue-Green Infrastructure**: Integrating urban wetland bioswales and fountain parks creates localized micro-climate cooling zones.\n"
                "4. **Shade Canopies & Reflective Pavements**: Cool pavement materials stop asphalt from storing heat during daylight hours.\n\n"
                "You can submit or view community-proposed cooling interventions in the **Community Suggestions** tab!")

    # 5. How to use Thermacity / Platform navigation
    if any(k in query for k in ['how to', 'project', 'upload', 'twin', 'model', 'feature', 'help', 'thermacity']):
        return ("### 🚀 How to Navigate Thermacity Platform\n\n"
                "- **Hotspot Map**: Interactive map showing heat metrics and risk levels across Tamil Nadu districts.\n"
                "- **Digital Twin Simulator**: Adjust surface albedo, vegetation, and water bodies to simulate micro-climate thermal response.\n"
                "- **Explainable AI (XAI)**: View SHAP feature attributions showing how NDVI, NDBI, and solar radiation drive district thermal risk.\n"
                "- **Mitigation Projects & Suggestions**: Propose community cooling ideas, upvote interventions, or track municipal cooling initiatives.\n"
                "- **ML Predictions**: Train Random Forest / Gradient Boosting models to forecast upcoming thermal trends.")

    # Generic Friendly Default Fallback
    ctx_str = f" for **{context.district_name}**" if context and context.district_name else ""
    return (f"### 🌡️ Thermacity AI Copilot\n\n"
            f"Hello! I am ready to assist you with urban heat intelligence{ctx_str}.\n\n"
            f"You can ask me about:\n"
            f"- **District heat status**: *\"What is the heat risk in Chennai?\"* or *\"Which districts are hottest?\"*\n"
            f"- **Cooling solutions**: *\"Best strategies to lower surface temperature in urban areas\"*\n"
            f"- **Thermal analytics**: *\"Explain LST vs NDVI vs NDBI\"*\n"
            f"- **Platform tools**: *\"How do I use the Digital Twin simulator?\"*\n\n"
            f"How can I help cool your district today?")

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, db: Database = Depends(get_db)):
    # 1. Gather live database district metrics to enrich prompt / fallback
    district_list = []
    try:
        db_districts = district_repo.get_all(db)
        for d in db_districts:
            district_list.append({
                "name": d["name"],
                "lst": float(d.get("lst", 0.0)),
                "ndvi": float(d.get("ndvi", 0.0)),
                "ndbi": float(d.get("ndbi", 0.0)),
                "heat_index": d.get("heat_index", 0.0),
                "risk_level": d.get("risk_level", "Unknown")
            })
    except Exception:
        pass

    last_user_message = ""
    for msg in reversed(request.messages):
        if msg.role == 'user':
            last_user_message = msg.content
            break

    # 2. Try Gemini LLM if API Key is configured and package is installed
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            # Build dataset summary text
            summary_lines = []
            for d in district_list:
                summary_lines.append(f"- {d['name']}: LST={d['lst']}°C, Risk={d['risk_level']}, NDVI={d['ndvi']}, NDBI={d['ndbi']}")
            district_summary_text = "\n".join(summary_lines) if summary_lines else "Districts loaded."

            # Session context text
            session_context = "No specific district active."
            if request.context:
                if request.context.district_name:
                    session_context = f"Currently active district in view: {request.context.district_name}"
                if request.context.active_tab:
                    session_context += f" | Current tab: {request.context.active_tab}"

            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                district_data_summary=district_summary_text,
                session_context=session_context
            )

            model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_prompt)
            
            formatted_messages = []
            for msg in request.messages:
                if msg.role == 'system':
                    continue
                role = 'user' if msg.role == 'user' else 'model'
                formatted_messages.append({
                    'role': role,
                    'parts': [msg.content]
                })
                
            response = model.generate_content(formatted_messages)
            if response and response.text:
                return {"response": response.text}
        except Exception:
            # Clean fallback if API key is invalid or quota exceeded or import fails
            pass

    # 3. Fallback engine if Gemini is unconfigured, absent, or errored
    fallback_reply = generate_domain_fallback(last_user_message, request.context, district_list)
    return {"response": fallback_reply}


