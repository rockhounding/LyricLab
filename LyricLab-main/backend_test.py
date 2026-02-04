#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid

class LyricLabAPITester:
    def __init__(self, base_url="https://lyricsmith-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'No error details')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "health", 200)

    def test_unauthenticated_endpoints(self):
        """Test endpoints that should work without authentication"""
        print("\n🔍 Testing Unauthenticated Access...")
        
        # Test /auth/me without token (should return 401)
        self.run_test("Auth Me (No Token)", "GET", "auth/me", 401)

    def create_test_user_session(self):
        """Create test user and session directly in MongoDB"""
        print("\n🔍 Creating Test User and Session...")
        
        try:
            import subprocess
            
            # Generate unique IDs
            timestamp = int(datetime.now().timestamp())
            user_id = f"test_user_{timestamp}"
            session_token = f"test_session_{timestamp}"
            email = f"test.user.{timestamp}@example.com"
            
            # Create MongoDB script
            mongo_script = f'''
use('test_database');
db.users.insertOne({{
  user_id: "{user_id}",
  email: "{email}",
  name: "Test User",
  picture: "https://via.placeholder.com/150",
  created_at: "{datetime.now(timezone.utc).isoformat()}"
}});
db.user_sessions.insertOne({{
  user_id: "{user_id}",
  session_token: "{session_token}",
  expires_at: "{(datetime.now(timezone.utc) + timedelta(days=7)).isoformat()}",
  created_at: "{datetime.now(timezone.utc).isoformat()}"
}});
print("User and session created successfully");
'''
            
            # Execute MongoDB script
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                self.log_test("Create Test User & Session", True, f"User ID: {user_id}")
                return True
            else:
                self.log_test("Create Test User & Session", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Create Test User & Session", False, f"Error: {str(e)}")
            return False

    def test_authenticated_endpoints(self):
        """Test endpoints that require authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated tests")
            return
            
        print("\n🔍 Testing Authenticated Endpoints...")
        
        # Test /auth/me with token
        success, user_data = self.run_test("Auth Me (With Token)", "GET", "auth/me", 200)
        
        if success and user_data:
            print(f"   User: {user_data.get('name')} ({user_data.get('email')})")

    def test_songs_crud(self):
        """Test songs CRUD operations"""
        if not self.session_token:
            print("❌ No session token available for CRUD tests")
            return
            
        print("\n🔍 Testing Songs CRUD Operations...")
        
        # Test list songs (empty initially)
        self.run_test("List Songs (Empty)", "GET", "songs", 200)
        
        # Test create song
        song_data = {
            "title": "Test Song",
            "lyrics_text": "This is a test song\nWith some test lyrics",
            "song_spec": {
                "genre": "Pop",
                "mood": "Happy",
                "perspective": "I",
                "structure": "Verse/Chorus/Verse/Chorus",
                "rhyme_scheme": "AABB"
            }
        }
        
        success, created_song = self.run_test("Create Song", "POST", "songs", 201, song_data)
        
        if success and created_song:
            song_id = created_song.get('song_id')
            print(f"   Created song ID: {song_id}")
            
            # Test get specific song
            self.run_test("Get Song", "GET", f"songs/{song_id}", 200)
            
            # Test update song
            update_data = {
                "title": "Updated Test Song",
                "status": "done"
            }
            self.run_test("Update Song", "PUT", f"songs/{song_id}", 200, update_data)
            
            # Test duplicate song
            self.run_test("Duplicate Song", "POST", f"songs/{song_id}/duplicate", 200)
            
            # Test list songs (should have 2 now)
            success, songs_list = self.run_test("List Songs (With Data)", "GET", "songs", 200)
            if success and songs_list:
                print(f"   Total songs: {len(songs_list)}")
            
            # Test delete song
            self.run_test("Delete Song", "DELETE", f"songs/{song_id}", 200)
        
        # Test get non-existent song
        self.run_test("Get Non-existent Song", "GET", "songs/nonexistent", 404)

    def test_lyrics_generation(self):
        """Test lyrics generation endpoints (may skip due to LLM costs)"""
        if not self.session_token:
            print("❌ No session token available for lyrics generation tests")
            return
            
        print("\n🔍 Testing Lyrics Generation...")
        print("⚠️  Skipping actual LLM calls to avoid costs - testing endpoint availability only")
        
        # Test generate endpoint structure (expect it to fail due to LLM call, but should not be 404)
        song_spec = {
            "title": "Test Generation",
            "genre": "Pop",
            "mood": "Happy",
            "ai_freedom": 50
        }
        
        # We expect this to either work (200) or fail with 500 (LLM error), but not 404
        success, response = self.run_test("Lyrics Generate Endpoint", "POST", "lyrics/generate", 200, {"song_spec": song_spec})
        
        if not success:
            # Check if it's a 500 error (LLM issue) which is acceptable
            print("   Note: LLM generation may fail due to API limits - endpoint structure is being tested")

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        try:
            import subprocess
            
            mongo_script = '''
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
db.songs.deleteMany({user_id: /test_user_/});
print("Test data cleaned up");
'''
            
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.log_test("Cleanup Test Data", True)
            else:
                self.log_test("Cleanup Test Data", False, f"MongoDB error: {result.stderr}")
                
        except Exception as e:
            self.log_test("Cleanup Test Data", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting LyricLab API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Basic health tests
        self.test_health_endpoints()
        
        # Unauthenticated tests
        self.test_unauthenticated_endpoints()
        
        # Create test user and session
        if self.create_test_user_session():
            # Authenticated tests
            self.test_authenticated_endpoints()
            
            # CRUD tests
            self.test_songs_crud()
            
            # Lyrics generation tests
            self.test_lyrics_generation()
            
            # Cleanup
            self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed - check details above")
            return 1

def main():
    tester = LyricLabAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())