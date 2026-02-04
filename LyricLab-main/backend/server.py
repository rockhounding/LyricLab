from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SongSpec(BaseModel):
    title: Optional[str] = ""
    topic: Optional[str] = ""
    genre: Optional[str] = ""
    subgenre: Optional[str] = ""
    mood: Optional[str] = ""
    custom_mood: Optional[str] = ""
    perspective: Optional[str] = "I"
    structure: Optional[str] = "Verse/Chorus/Verse/Chorus/Bridge/Chorus"
    rhyme_scheme: Optional[str] = "AABB"
    rhyme_variety: Optional[int] = 50
    internal_rhyme_density: Optional[int] = 25
    cadence_complexity: Optional[int] = 50
    imagery_progression: Optional[bool] = False
    word_choice: Optional[int] = 50
    directness: Optional[int] = 50
    profanity: Optional[str] = "None"
    forbidden_words: Optional[List[str]] = []
    ai_freedom: Optional[int] = 50
    sample_lyrics: Optional[str] = ""

class Song(BaseModel):
    song_id: str
    user_id: str
    title: str
    lyrics_text: str
    song_spec_json: Dict[str, Any]
    status: str = "draft"  # "draft" or "done"
    used_in_final_track: bool = False
    created_at: datetime
    updated_at: datetime
    version_history: Optional[List[Dict[str, Any]]] = []

class SongCreate(BaseModel):
    title: str = ""
    lyrics_text: str = ""
    song_spec: SongSpec

class SongUpdate(BaseModel):
    title: Optional[str] = None
    lyrics_text: Optional[str] = None
    song_spec: Optional[SongSpec] = None
    status: Optional[str] = None
    used_in_final_track: Optional[bool] = None

class GenerateLyricsRequest(BaseModel):
    song_spec: SongSpec

class RewriteLyricsRequest(BaseModel):
    song_spec: SongSpec
    current_lyrics: str

class RewriteSectionRequest(BaseModel):
    song_spec: SongSpec
    current_lyrics: str
    section: str  # "Verse 1", "Chorus", "Verse 2", "Bridge", etc.
    section_rhyme_scheme: Optional[str] = None  # Override rhyme scheme for this section

class GenerateVariationsRequest(BaseModel):
    song_spec: SongSpec
    current_lyrics: str
    section: Optional[str] = None  # If None, generate variations of full song
    section_rhyme_scheme: Optional[str] = None  # Override rhyme scheme for variations
    count: int = 4  # Number of variations to generate

class CustomEditRequest(BaseModel):
    song_spec: SongSpec
    current_lyrics: str
    section: Optional[str] = None  # If None, edit full song
    prompt: str  # User's custom instruction

class TransformLyricsRequest(BaseModel):
    current_lyrics: str
    new_topic: Optional[str] = None
    new_mood: Optional[str] = None
    new_genre: Optional[str] = None
    keep_cadence: bool = True
    keep_rhyme_scheme: bool = True
    keep_structure: bool = True
    additional_instructions: Optional[str] = None

# ============ AUTH HELPERS ============

async def get_current_user(request: Request) -> User:
    """Extract user from session token in cookie or Authorization header."""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for a session token."""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = auth_response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"],
                "picture": user_data.get("picture")
            }}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session."""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ LYRICS GENERATION ============

def build_lyrics_prompt(spec: SongSpec, rewrite_lyrics: str = None, section_to_rewrite: str = None, section_rhyme_scheme: str = None) -> str:
    """Build the prompt for lyrics generation."""
    
    prompt_parts = []
    
    # Title
    if spec.title:
        prompt_parts.append(f"Song Title: {spec.title}")
    
    # Topic
    if spec.topic:
        prompt_parts.append(f"Topic/Theme: {spec.topic}")
    
    # Genre
    genre_str = spec.genre or ""
    if spec.subgenre:
        genre_str = f"{spec.subgenre} ({spec.genre})" if genre_str else spec.subgenre
    if genre_str:
        prompt_parts.append(f"Genre: {genre_str}")
    
    # Mood
    mood_str = spec.custom_mood if spec.custom_mood else spec.mood
    if mood_str:
        prompt_parts.append(f"Mood/Emotion: {mood_str}")
    
    # Perspective
    if spec.perspective:
        perspectives = {
            "I": "First person (I/me)",
            "You": "Second person (you)",
            "We": "First person plural (we)",
            "3rd": "Third person (he/she/they)"
        }
        prompt_parts.append(f"Perspective: {perspectives.get(spec.perspective, spec.perspective)}")
    
    # Structure
    if spec.structure:
        prompt_parts.append(f"Song Structure: {spec.structure}")
    
    # Rhyme scheme
    if spec.rhyme_scheme:
        prompt_parts.append(f"Rhyme Scheme: {spec.rhyme_scheme}")
    
    # Rhyme variety
    if spec.rhyme_variety is not None:
        variety_desc = "repeat similar sounds" if spec.rhyme_variety < 30 else "vary rhymes frequently" if spec.rhyme_variety > 70 else "moderate rhyme variety"
        prompt_parts.append(f"Rhyme Variety: {variety_desc}")
    
    # Internal rhyme density
    if spec.internal_rhyme_density is not None:
        density_desc = "no internal rhymes" if spec.internal_rhyme_density < 20 else "heavy internal rhyming" if spec.internal_rhyme_density > 80 else "some internal rhymes"
        prompt_parts.append(f"Internal Rhyme: {density_desc}")
    
    # Cadence complexity
    if spec.cadence_complexity is not None:
        cadence_desc = "simple, steady rhythm" if spec.cadence_complexity < 30 else "syncopated, complex rhythms" if spec.cadence_complexity > 70 else "moderate rhythmic variation"
        prompt_parts.append(f"Cadence: {cadence_desc}")
    
    # Imagery progression
    if spec.imagery_progression:
        prompt_parts.append("Imagery: Introduce new imagery as the song progresses, evolving the visual landscape")
    
    # Word choice
    if spec.word_choice is not None:
        word_desc = "plain, everyday language" if spec.word_choice < 30 else "poetic, elevated vocabulary" if spec.word_choice > 70 else "balanced vocabulary"
        prompt_parts.append(f"Word Choice: {word_desc}")
    
    # Directness
    if spec.directness is not None:
        direct_desc = "literal, direct meaning" if spec.directness < 30 else "abstract, metaphorical" if spec.directness > 70 else "balance of literal and figurative"
        prompt_parts.append(f"Style: {direct_desc}")
    
    # Profanity
    if spec.profanity and spec.profanity != "None":
        prompt_parts.append(f"Profanity: {spec.profanity} allowed")
    
    # Forbidden words
    if spec.forbidden_words:
        prompt_parts.append(f"Forbidden words/phrases: {', '.join(spec.forbidden_words)}")
    
    # Sample lyrics as inspiration
    if spec.sample_lyrics:
        prompt_parts.append(f"\nStyle Inspiration (write in a similar style to this):\n{spec.sample_lyrics}")
    
    # Build the main prompt
    spec_text = "\n".join(prompt_parts) if prompt_parts else "Write original song lyrics"
    
    # Determine strictness based on AI freedom
    freedom = spec.ai_freedom or 50
    if freedom < 30:
        strictness = "Follow the specifications exactly. Do not deviate from the requested style, structure, or content."
    elif freedom > 70:
        strictness = "Use these specifications as a starting point but feel free to make creative additions that enhance the song while staying true to the theme."
    else:
        strictness = "Follow the specifications while allowing some creative interpretation where it improves the flow."
    
    # Main instruction
    if section_to_rewrite and rewrite_lyrics:
        rhyme_instruction = ""
        if section_rhyme_scheme:
            rhyme_instruction = f"\nIMPORTANT: Use {section_rhyme_scheme} rhyme scheme for this {section_to_rewrite}."
        
        instruction = f"""Rewrite ONLY the {section_to_rewrite} section of this song.

Current lyrics:
{rewrite_lyrics}

Song specifications:
{spec_text}
{rhyme_instruction}

{strictness}

Output ONLY the complete song lyrics with the rewritten {section_to_rewrite}. Keep all other sections exactly as they are.
Use section headers exactly like: [VERSE 1], [CHORUS], [VERSE 2], [BRIDGE], etc.
Leave a blank line between sections.
Do not include any explanations or commentary."""
    
    elif rewrite_lyrics:
        instruction = f"""Rewrite this entire song while maintaining its core essence and theme.

Current lyrics:
{rewrite_lyrics}

Song specifications:
{spec_text}

{strictness}

Output ONLY the lyrics. Use section headers exactly like: [VERSE 1], [CHORUS], [VERSE 2], [BRIDGE], etc.
Leave a blank line between sections.
Do not include any explanations or commentary."""
    
    else:
        instruction = f"""Write original song lyrics based on these specifications:

{spec_text}

{strictness}

Output ONLY the lyrics. Use section headers exactly like: [VERSE 1], [CHORUS], [VERSE 2], [BRIDGE], etc.
Leave a blank line between sections.
Do not include any explanations or commentary."""
    
    return instruction

async def generate_with_llm(prompt: str, temperature: float = 0.7) -> str:
    """Generate lyrics using OpenAI GPT-5.2 via emergentintegrations."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"lyrics_{uuid.uuid4().hex[:8]}",
        system_message="You are a professional songwriter and lyricist. You write compelling, creative, and emotionally resonant song lyrics. You follow formatting instructions precisely."
    )
    chat.with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return response

@api_router.post("/lyrics/generate")
async def generate_lyrics(request: GenerateLyricsRequest, user: User = Depends(get_current_user)):
    """Generate new lyrics from scratch based on SongSpec."""
    prompt = build_lyrics_prompt(request.song_spec)
    
    # Map AI freedom to temperature (0-100 -> 0.3-1.0)
    freedom = request.song_spec.ai_freedom or 50
    temperature = 0.3 + (freedom / 100) * 0.7
    
    lyrics = await generate_with_llm(prompt, temperature)
    return {"lyrics": lyrics}

@api_router.post("/lyrics/rewrite")
async def rewrite_lyrics(request: RewriteLyricsRequest, user: User = Depends(get_current_user)):
    """Rewrite entire song using current lyrics as reference."""
    prompt = build_lyrics_prompt(request.song_spec, rewrite_lyrics=request.current_lyrics)
    
    freedom = request.song_spec.ai_freedom or 50
    temperature = 0.3 + (freedom / 100) * 0.7
    
    lyrics = await generate_with_llm(prompt, temperature)
    return {"lyrics": lyrics}

@api_router.post("/lyrics/rewrite-section")
async def rewrite_section(request: RewriteSectionRequest, user: User = Depends(get_current_user)):
    """Rewrite a specific section of the song with optional rhyme scheme override."""
    prompt = build_lyrics_prompt(
        request.song_spec,
        rewrite_lyrics=request.current_lyrics,
        section_to_rewrite=request.section,
        section_rhyme_scheme=request.section_rhyme_scheme
    )
    
    freedom = request.song_spec.ai_freedom or 50
    temperature = 0.3 + (freedom / 100) * 0.7
    
    lyrics = await generate_with_llm(prompt, temperature)
    return {"lyrics": lyrics}

@api_router.post("/lyrics/variations")
async def generate_variations(request: GenerateVariationsRequest, user: User = Depends(get_current_user)):
    """Generate multiple variations of lyrics or a specific section."""
    import asyncio
    
    freedom = request.song_spec.ai_freedom or 50
    # Higher temperature for more variety in variations
    base_temp = 0.5 + (freedom / 100) * 0.5
    
    async def generate_single_variation(index: int):
        # Vary temperature slightly for each variation
        temp = base_temp + (index * 0.05)
        temp = min(temp, 1.0)
        
        rhyme_instruction = ""
        if request.section_rhyme_scheme:
            rhyme_instruction = f"\nIMPORTANT: Use {request.section_rhyme_scheme} rhyme scheme for this section."
        
        if request.section:
            # Generate variation of specific section
            prompt = f"""Generate an alternative version of the {request.section} for this song.

Current lyrics:
{request.current_lyrics}

Song specifications:
Title: {request.song_spec.title or 'Untitled'}
Topic: {request.song_spec.topic or 'General'}
Genre: {request.song_spec.genre or 'Any'} {('(' + request.song_spec.subgenre + ')') if request.song_spec.subgenre else ''}
Mood: {request.song_spec.custom_mood or request.song_spec.mood or 'Any'}
{rhyme_instruction}

Create a fresh, creative alternative for the {request.section}. 
Make it distinctly different from the original while keeping the same theme.
Output ONLY the {request.section} lyrics, nothing else. Include the section header like [{request.section.upper()}]."""
        else:
            # Generate full song variation
            prompt = build_lyrics_prompt(request.song_spec)
            prompt += "\n\nCreate a fresh, creative version that explores the theme differently."
        
        try:
            result = await generate_with_llm(prompt, temp)
            return {"index": index, "lyrics": result}
        except Exception as e:
            logger.error(f"Variation {index} failed: {e}")
            return {"index": index, "lyrics": None, "error": str(e)}
    
    # Generate variations in parallel (limit to requested count, max 6)
    count = min(request.count, 6)
    tasks = [generate_single_variation(i) for i in range(count)]
    results = await asyncio.gather(*tasks)
    
    # Filter out failed generations
    variations = [r for r in results if r.get("lyrics")]
    
    return {"variations": variations, "total_requested": count, "total_generated": len(variations)}

@api_router.post("/lyrics/custom-edit")
async def custom_edit(request: CustomEditRequest, user: User = Depends(get_current_user)):
    """Apply a custom edit based on user's natural language prompt."""
    
    freedom = request.song_spec.ai_freedom or 50
    temperature = 0.4 + (freedom / 100) * 0.5
    
    if request.section:
        # Edit specific section
        prompt = f"""Edit the {request.section} of this song based on the following instruction:

USER INSTRUCTION: {request.prompt}

Current full lyrics:
{request.current_lyrics}

Song context:
Title: {request.song_spec.title or 'Untitled'}
Genre: {request.song_spec.genre or 'Any'} {('(' + request.song_spec.subgenre + ')') if request.song_spec.subgenre else ''}
Mood: {request.song_spec.custom_mood or request.song_spec.mood or 'Any'}

IMPORTANT: Apply the user's instruction ONLY to the {request.section}. Keep all other sections exactly as they are.
Output the COMPLETE song with all sections, with only the {request.section} modified.
Use section headers like [VERSE 1], [CHORUS], [BRIDGE], etc.
Do not include any explanations."""
    else:
        # Edit full song
        prompt = f"""Edit this entire song based on the following instruction:

USER INSTRUCTION: {request.prompt}

Current lyrics:
{request.current_lyrics}

Song context:
Title: {request.song_spec.title or 'Untitled'}
Genre: {request.song_spec.genre or 'Any'} {('(' + request.song_spec.subgenre + ')') if request.song_spec.subgenre else ''}
Mood: {request.song_spec.custom_mood or request.song_spec.mood or 'Any'}

Apply the user's instruction to improve the song.
Use section headers like [VERSE 1], [CHORUS], [BRIDGE], etc.
Output ONLY the edited lyrics, no explanations."""
    
    lyrics = await generate_with_llm(prompt, temperature)
    return {"lyrics": lyrics}

@api_router.post("/lyrics/transform")
async def transform_lyrics(request: TransformLyricsRequest, user: User = Depends(get_current_user)):
    """Transform existing lyrics - change topic/mood/genre while preserving style elements."""
    
    preserve_instructions = []
    if request.keep_cadence:
        preserve_instructions.append("PRESERVE the exact rhythm, cadence, and syllable patterns of each line")
    if request.keep_rhyme_scheme:
        preserve_instructions.append("PRESERVE the exact rhyme scheme and rhyme positions")
    if request.keep_structure:
        preserve_instructions.append("PRESERVE the exact song structure (same sections, same number of lines per section)")
    
    preserve_text = "\n- ".join(preserve_instructions) if preserve_instructions else "You may adjust structure as needed"
    
    change_instructions = []
    if request.new_topic:
        change_instructions.append(f"Change the TOPIC/SUBJECT to: {request.new_topic}")
    if request.new_mood:
        change_instructions.append(f"Change the MOOD/EMOTION to: {request.new_mood}")
    if request.new_genre:
        change_instructions.append(f"Adapt the STYLE to fit: {request.new_genre} genre")
    
    change_text = "\n- ".join(change_instructions) if change_instructions else "Improve and refine the lyrics"
    
    additional = f"\nAdditional instructions: {request.additional_instructions}" if request.additional_instructions else ""
    
    prompt = f"""Transform these existing lyrics while preserving their musical qualities.

ORIGINAL LYRICS:
{request.current_lyrics}

WHAT TO PRESERVE:
- {preserve_text}

WHAT TO CHANGE:
- {change_text}
{additional}

IMPORTANT GUIDELINES:
- Each new line should have the same number of syllables as the original line it replaces
- Rhyming words should rhyme in the same positions as the original
- The "singability" and flow must match the original
- Use section headers like [VERSE 1], [CHORUS], [BRIDGE], etc.

Output ONLY the transformed lyrics, no explanations."""
    
    lyrics = await generate_with_llm(prompt, 0.7)
    return {"lyrics": lyrics}

# ============ SONG CRUD ============

@api_router.post("/songs", response_model=dict, status_code=201)
async def create_song(song_data: SongCreate, user: User = Depends(get_current_user)):
    """Create a new song."""
    now = datetime.now(timezone.utc)
    song_id = f"song_{uuid.uuid4().hex[:12]}"
    
    song_doc = {
        "song_id": song_id,
        "user_id": user.user_id,
        "title": song_data.title or "Untitled Song",
        "lyrics_text": song_data.lyrics_text,
        "song_spec_json": song_data.song_spec.model_dump(),
        "status": "draft",
        "used_in_final_track": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "version_history": []
    }
    
    await db.songs.insert_one(song_doc)
    
    result = await db.songs.find_one({"song_id": song_id}, {"_id": 0})
    return result

@api_router.get("/songs", response_model=List[dict])
async def list_songs(user: User = Depends(get_current_user)):
    """List all songs for the current user."""
    songs = await db.songs.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return songs

@api_router.get("/songs/{song_id}", response_model=dict)
async def get_song(song_id: str, user: User = Depends(get_current_user)):
    """Get a specific song."""
    song = await db.songs.find_one(
        {"song_id": song_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return song

@api_router.put("/songs/{song_id}", response_model=dict)
async def update_song(song_id: str, song_update: SongUpdate, user: User = Depends(get_current_user)):
    """Update a song."""
    song = await db.songs.find_one(
        {"song_id": song_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    update_data = {}
    
    # Save current version to history if lyrics changed
    if song_update.lyrics_text is not None and song_update.lyrics_text != song.get("lyrics_text"):
        version_history = song.get("version_history", [])
        version_history.append({
            "lyrics_text": song.get("lyrics_text"),
            "saved_at": datetime.now(timezone.utc).isoformat()
        })
        # Keep only last 3 versions
        if len(version_history) > 3:
            version_history = version_history[-3:]
        update_data["version_history"] = version_history
    
    if song_update.title is not None:
        update_data["title"] = song_update.title
    if song_update.lyrics_text is not None:
        update_data["lyrics_text"] = song_update.lyrics_text
    if song_update.song_spec is not None:
        update_data["song_spec_json"] = song_update.song_spec.model_dump()
    if song_update.status is not None:
        update_data["status"] = song_update.status
    if song_update.used_in_final_track is not None:
        update_data["used_in_final_track"] = song_update.used_in_final_track
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.songs.update_one(
        {"song_id": song_id},
        {"$set": update_data}
    )
    
    updated_song = await db.songs.find_one({"song_id": song_id}, {"_id": 0})
    return updated_song

@api_router.delete("/songs/{song_id}")
async def delete_song(song_id: str, user: User = Depends(get_current_user)):
    """Delete a song."""
    result = await db.songs.delete_one(
        {"song_id": song_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return {"message": "Song deleted"}

@api_router.post("/songs/{song_id}/duplicate", response_model=dict)
async def duplicate_song(song_id: str, user: User = Depends(get_current_user)):
    """Duplicate a song."""
    song = await db.songs.find_one(
        {"song_id": song_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    now = datetime.now(timezone.utc)
    new_song_id = f"song_{uuid.uuid4().hex[:12]}"
    
    new_song = {
        "song_id": new_song_id,
        "user_id": user.user_id,
        "title": f"{song['title']} (Copy)",
        "lyrics_text": song["lyrics_text"],
        "song_spec_json": song["song_spec_json"],
        "status": "draft",
        "used_in_final_track": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "version_history": []
    }
    
    await db.songs.insert_one(new_song)
    
    result = await db.songs.find_one({"song_id": new_song_id}, {"_id": 0})
    return result

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "LyricLab API"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
