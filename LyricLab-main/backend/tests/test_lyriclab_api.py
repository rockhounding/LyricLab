"""
LyricLab API Tests - Comprehensive backend testing
Tests: Health, Auth, Songs CRUD, Lyrics Generation endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = os.environ.get('TEST_SESSION_TOKEN', '')

class TestHealthEndpoints:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_auth_me_with_invalid_token(self):
        """Test /api/auth/me returns 401 with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_123"}
        )
        assert response.status_code == 401
    
    def test_auth_me_with_valid_token(self):
        """Test /api/auth/me returns user data with valid token"""
        if not SESSION_TOKEN:
            pytest.skip("No session token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
    
    def test_logout_endpoint(self):
        """Test /api/auth/logout works"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200


class TestSongsCRUD:
    """Songs CRUD endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        if not SESSION_TOKEN:
            pytest.skip("No session token available")
        return {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}
    
    def test_list_songs_without_auth(self):
        """Test /api/songs returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/songs")
        assert response.status_code == 401
    
    def test_list_songs_with_auth(self, auth_headers):
        """Test /api/songs returns list with auth"""
        response = requests.get(f"{BASE_URL}/api/songs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_song(self, auth_headers):
        """Test POST /api/songs creates a song"""
        payload = {
            "title": "TEST_Song_Create",
            "lyrics_text": "[VERSE 1]\nTest lyrics line 1\nTest lyrics line 2",
            "song_spec": {
                "topic": "Testing",
                "genre": "Pop",
                "mood": "Happy"
            }
        }
        response = requests.post(f"{BASE_URL}/api/songs", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert "song_id" in data
        assert data["title"] == "TEST_Song_Create"
        assert data["lyrics_text"] == payload["lyrics_text"]
        
        # Cleanup
        song_id = data["song_id"]
        requests.delete(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
    
    def test_create_and_get_song(self, auth_headers):
        """Test create song and verify with GET"""
        # Create
        payload = {
            "title": "TEST_Song_GetVerify",
            "lyrics_text": "[CHORUS]\nTest chorus lyrics",
            "song_spec": {"genre": "Rock"}
        }
        create_response = requests.post(f"{BASE_URL}/api/songs", json=payload, headers=auth_headers)
        assert create_response.status_code == 201
        song_id = create_response.json()["song_id"]
        
        # Get and verify
        get_response = requests.get(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["title"] == "TEST_Song_GetVerify"
        assert data["song_id"] == song_id
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
    
    def test_update_song(self, auth_headers):
        """Test PUT /api/songs/{id} updates a song"""
        # Create first
        create_payload = {
            "title": "TEST_Song_Update_Original",
            "lyrics_text": "Original lyrics",
            "song_spec": {}
        }
        create_response = requests.post(f"{BASE_URL}/api/songs", json=create_payload, headers=auth_headers)
        song_id = create_response.json()["song_id"]
        
        # Update
        update_payload = {
            "title": "TEST_Song_Update_Modified",
            "lyrics_text": "Modified lyrics"
        }
        update_response = requests.put(f"{BASE_URL}/api/songs/{song_id}", json=update_payload, headers=auth_headers)
        assert update_response.status_code == 200
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
        data = get_response.json()
        assert data["title"] == "TEST_Song_Update_Modified"
        assert data["lyrics_text"] == "Modified lyrics"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
    
    def test_delete_song(self, auth_headers):
        """Test DELETE /api/songs/{id} removes a song"""
        # Create first
        create_payload = {
            "title": "TEST_Song_Delete",
            "lyrics_text": "To be deleted",
            "song_spec": {}
        }
        create_response = requests.post(f"{BASE_URL}/api/songs", json=create_payload, headers=auth_headers)
        song_id = create_response.json()["song_id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/songs/{song_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_duplicate_song(self, auth_headers):
        """Test POST /api/songs/{id}/duplicate creates a copy"""
        # Create original
        create_payload = {
            "title": "TEST_Song_Original",
            "lyrics_text": "Original content",
            "song_spec": {"genre": "Jazz"}
        }
        create_response = requests.post(f"{BASE_URL}/api/songs", json=create_payload, headers=auth_headers)
        original_id = create_response.json()["song_id"]
        
        # Duplicate
        dup_response = requests.post(f"{BASE_URL}/api/songs/{original_id}/duplicate", headers=auth_headers)
        assert dup_response.status_code == 200
        dup_data = dup_response.json()
        assert dup_data["song_id"] != original_id
        assert "Copy" in dup_data["title"]
        assert dup_data["lyrics_text"] == "Original content"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/songs/{original_id}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/api/songs/{dup_data['song_id']}", headers=auth_headers)
    
    def test_get_nonexistent_song(self, auth_headers):
        """Test GET /api/songs/{id} returns 404 for nonexistent song"""
        response = requests.get(f"{BASE_URL}/api/songs/nonexistent_song_id", headers=auth_headers)
        assert response.status_code == 404


class TestLyricsEndpoints:
    """Lyrics generation endpoint tests - tests endpoint availability"""
    
    @pytest.fixture
    def auth_headers(self):
        if not SESSION_TOKEN:
            pytest.skip("No session token available")
        return {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}
    
    def test_generate_lyrics_without_auth(self):
        """Test /api/lyrics/generate returns 401 without auth"""
        payload = {"song_spec": {"topic": "Test"}}
        response = requests.post(f"{BASE_URL}/api/lyrics/generate", json=payload)
        assert response.status_code == 401
    
    def test_rewrite_lyrics_without_auth(self):
        """Test /api/lyrics/rewrite returns 401 without auth"""
        payload = {"song_spec": {}, "current_lyrics": "Test"}
        response = requests.post(f"{BASE_URL}/api/lyrics/rewrite", json=payload)
        assert response.status_code == 401
    
    def test_rewrite_section_without_auth(self):
        """Test /api/lyrics/rewrite-section returns 401 without auth"""
        payload = {"song_spec": {}, "current_lyrics": "Test", "section": "Verse 1"}
        response = requests.post(f"{BASE_URL}/api/lyrics/rewrite-section", json=payload)
        assert response.status_code == 401
    
    def test_variations_without_auth(self):
        """Test /api/lyrics/variations returns 401 without auth"""
        payload = {"song_spec": {}, "current_lyrics": "Test", "count": 2}
        response = requests.post(f"{BASE_URL}/api/lyrics/variations", json=payload)
        assert response.status_code == 401
    
    def test_custom_edit_without_auth(self):
        """Test /api/lyrics/custom-edit returns 401 without auth"""
        payload = {"song_spec": {}, "current_lyrics": "Test", "prompt": "Make it shorter"}
        response = requests.post(f"{BASE_URL}/api/lyrics/custom-edit", json=payload)
        assert response.status_code == 401
    
    def test_transform_without_auth(self):
        """Test /api/lyrics/transform returns 401 without auth"""
        payload = {"current_lyrics": "Test lyrics", "new_topic": "Love"}
        response = requests.post(f"{BASE_URL}/api/lyrics/transform", json=payload)
        assert response.status_code == 401
    
    def test_transform_endpoint_exists(self, auth_headers):
        """Test /api/lyrics/transform endpoint exists and accepts valid payload"""
        payload = {
            "current_lyrics": "[VERSE 1]\nTest lyrics here\nAnother line of test",
            "new_topic": "Summer vacation",
            "new_mood": "Happy",
            "new_genre": "Pop",
            "keep_cadence": True,
            "keep_rhyme_scheme": True,
            "keep_structure": True
        }
        response = requests.post(f"{BASE_URL}/api/lyrics/transform", json=payload, headers=auth_headers, timeout=60)
        # Should return 200 with lyrics (LLM call)
        assert response.status_code == 200
        data = response.json()
        assert "lyrics" in data
        print(f"Transform response: {data.get('lyrics', '')[:100]}...")


class TestTransformFeature:
    """Specific tests for the Transform feature"""
    
    @pytest.fixture
    def auth_headers(self):
        if not SESSION_TOKEN:
            pytest.skip("No session token available")
        return {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}
    
    def test_transform_with_all_options(self, auth_headers):
        """Test transform with all options enabled"""
        payload = {
            "current_lyrics": "[VERSE 1]\nWalking down the street today\nFeeling like I'm here to stay\n\n[CHORUS]\nThis is my song\nSinging all day long",
            "new_topic": "Ocean waves",
            "new_mood": "Peaceful",
            "new_genre": "Acoustic",
            "keep_cadence": True,
            "keep_rhyme_scheme": True,
            "keep_structure": True,
            "additional_instructions": "Keep it simple"
        }
        response = requests.post(f"{BASE_URL}/api/lyrics/transform", json=payload, headers=auth_headers, timeout=60)
        assert response.status_code == 200
        data = response.json()
        assert "lyrics" in data
        assert len(data["lyrics"]) > 0
    
    def test_transform_minimal_options(self, auth_headers):
        """Test transform with minimal options"""
        payload = {
            "current_lyrics": "[VERSE 1]\nSimple test lyrics\nJust a few lines",
            "new_topic": "Space exploration"
        }
        response = requests.post(f"{BASE_URL}/api/lyrics/transform", json=payload, headers=auth_headers, timeout=60)
        assert response.status_code == 200
        data = response.json()
        assert "lyrics" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
