# LyricLab - Product Requirements Document

## Project Overview
**Name:** LyricLab  
**Tagline:** Where Sound Meets Syntax  
**Created:** February 2026  
**Status:** MVP Complete

## Original Problem Statement
Build a polished, working web app called LyricLab that helps users generate song lyrics (text only) using an LLM API. The app must look production-ready on mobile + desktop.

## User Choices/Inputs
- **LLM Provider:** OpenAI GPT-5.2 with Emergent LLM key
- **Authentication:** Emergent-managed Google OAuth
- **Genres:** Standard genres + sub-genres (trap pop, country hip-hop, pop rap, etc.)
- **Moods:** Generic options with custom mood capability
- **Additional:** Sample lyrics input for style inspiration

## User Personas
1. **Professional Songwriters** - Need fine-tuned control over lyrics structure and style
2. **Musicians/Bands** - Quick generation of lyrics for compositions
3. **Hobbyist Lyricists** - Exploring creativity with AI assistance
4. **Music Producers** - Need reference lyrics for track development

## Core Requirements (Static)
### Landing/Generate Page
- SongSpec controls: Title, Topic, Genre/Sub-genre, Mood (with custom), Perspective, Structure, Rhyme Scheme
- Sliders: Rhyme Variety, Internal Rhyme Density, Cadence Complexity, Word Choice, Directness, AI Freedom
- Sample lyrics inspiration input
- Forbidden words/phrases chips
- Generate, Rewrite, Rewrite Section buttons
- Save Draft / Done workflow

### Library Page
- Song list with Title, Creation date, Status (Draft/Done)
- Used/Unused track status visual distinction
- Search and filter by status/track usage

### Song Detail Page
- View/Edit lyrics
- Status toggle (Draft/Done)
- Used in track toggle
- Duplicate, Export (copy), Delete
- Version history (last 3 saved versions)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **LLM:** OpenAI GPT-5.2 via emergentintegrations
- **Auth:** Emergent Google OAuth

## What's Been Implemented (Feb 2026)
### Backend
- ✅ Google OAuth integration with session management
- ✅ User CRUD with custom user_id (not MongoDB _id)
- ✅ Song CRUD (create, read, update, delete, duplicate)
- ✅ Lyrics generation with OpenAI GPT-5.2
- ✅ Lyrics rewrite (full and section-based)
- ✅ Lyrics variations (generate 4-6 alternatives)
- ✅ Custom prompt editing (natural language instructions)
- ✅ **NEW: Transform Lyrics** - Change topic/mood/genre while preserving rhythm/cadence/structure
- ✅ SongSpec-to-prompt builder with all controls
- ✅ Version history on song updates (last 3)
- ✅ AI Freedom slider mapped to temperature

### Frontend
- ✅ Landing page with modern dark theme
- ✅ Generate page with full SongSpec controls
- ✅ 14 main genres with sub-genres
- ✅ 16 preset moods + custom mood input
- ✅ 6 creative sliders (Rhyme Variety, Internal Rhyme, Cadence, Word Choice, Directness, AI Freedom)
- ✅ Sample lyrics input for style inspiration
- ✅ Forbidden words chips input
- ✅ Drag-and-drop Structure Builder with genre-based templates
- ✅ Variations modal (generate & compare alternatives)
- ✅ Section-specific rewrites with multi-select rhyme schemes
- ✅ Custom prompt editing modal
- ✅ **NEW: Import Lyrics** - Paste your own lyrics to edit/transform
- ✅ **NEW: Transform Modal** - Change topic, mood, genre with preserve options
- ✅ Library page with search and filters
- ✅ Song detail page with edit/duplicate/export
- ✅ Version history viewer
- ✅ Used/Unused track status toggle
- ✅ Responsive mobile/desktop design

### Design System
- Dark theme with Electric Studio aesthetic
- Outfit font for headings
- JetBrains Mono for lyrics editor
- Purple/pink accent colors
- Glass morphism effects
- Noise texture overlay

## Prioritized Backlog

### P0 (Critical - Not Blocking)
- None - All core features implemented

### P1 (High Priority - Next)
- Connect Library Page (`/library`) to backend - display user's saved songs
- Connect Song Detail Page (`/song/:id`) to backend - view/edit saved songs
- Export to Clipboard functionality on Song Detail Page

### P2 (Nice to Have)
- Export formats (txt, PDF download)
- Favorite button to save multiple variations for comparison
- Edit history/undo feature
- Save custom prompts for reuse
- User-selectable color themes

### P3 (Future)
- Collaborative editing
- Song sharing with unique links
- Integration with music production tools

## Next Tasks
1. Implement Library Page backend integration
2. Implement Song Detail Page with full editing
3. Add Export to Clipboard functionality
4. Add variation favorites feature

## API Endpoints
- `POST /api/auth/session` - Exchange OAuth session_id
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/lyrics/generate` - Generate new lyrics
- `POST /api/lyrics/rewrite` - Rewrite entire song
- `POST /api/lyrics/rewrite-section` - Rewrite specific section with rhyme scheme override
- `POST /api/lyrics/variations` - Generate multiple lyric variations
- `POST /api/lyrics/custom-edit` - Edit with natural language prompt
- `POST /api/lyrics/transform` - Transform lyrics (change topic/mood/genre, preserve rhythm)
- `GET /api/songs` - List user's songs
- `POST /api/songs` - Create new song
- `GET /api/songs/{id}` - Get song details
- `PUT /api/songs/{id}` - Update song
- `DELETE /api/songs/{id}` - Delete song
- `POST /api/songs/{id}/duplicate` - Duplicate song

## Environment Variables
### Backend
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `EMERGENT_LLM_KEY` - Universal LLM key for OpenAI
- `CORS_ORIGINS` - Allowed origins

### Frontend
- `REACT_APP_BACKEND_URL` - Backend API URL
