import http.server
import socketserver
import json
import os
import sys
import shutil
import cgi
import mimetypes
from urllib.parse import urlparse, parse_qs

# Configuration
PORT = 8088
ADMIN_TOKEN = "mock-dev-token"
# Assume this script is in public/ folder, so root is one level up
# But we need to handle if it's run from root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) # Parent of public
DATA_FILE = os.path.join(PROJECT_ROOT, 'data.json')
UPLOADS_DIR = os.path.join(PROJECT_ROOT, 'uploads')
PUBLIC_DIR = SCRIPT_DIR # public folder

print(f"Project Root: {PROJECT_ROOT}")
print(f"Data File: {DATA_FILE}")
print(f"Uploads Dir: {UPLOADS_DIR}")
print(f"Public Dir: {PUBLIC_DIR}")

# Ensure uploads directory exists
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# Initialize data.json if not exists
if not os.path.exists(DATA_FILE):
    default_data = {
        "admin": {"username": "admin", "password": "mock_password_hash"},
        "profile": {
            "nickname": "徐小泡",
            "selfIntro": "热爱生活，喜欢创作。",
            "motto": "每一个不曾起舞的日子，都是对生命的辜负",
            "avatar": None
        },
        "works": []
    }
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(default_data, f, ensure_ascii=False, indent=2)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)

        # API: Get Works
        if path.startswith('/api/works/category/'):
            category = path.split('/')[-1]
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                works = data.get('works', [])
                if category != 'all':
                    works = [w for w in works if w.get('category') == category]
                
                # Sort by createTime desc
                works.sort(key=lambda x: x.get('createTime', 0), reverse=True)
                
                response = {"success": True, "works": works}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode('utf-8'))
            return

        # API: Get Profile
        if path == '/api/profile':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.wfile.write(json.dumps(data.get('profile', {})).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({}).encode('utf-8'))
            return

        # Serve Uploads with Range support
        if path.startswith('/uploads/'):
            # Temporarily switch directory to PROJECT_ROOT so SimpleHTTPRequestHandler finds uploads/...
            self.directory = PROJECT_ROOT
            try:
                # Use super().do_GET() to handle Range, Caching, MIME types etc.
                return super().do_GET()
            finally:
                # Restore directory just in case
                self.directory = PUBLIC_DIR

        # Fallback to default static file serving (from PUBLIC_DIR)
        return super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # API: Login
        if path == '/api/auth/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            # Mock login success
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"success": True, "token": ADMIN_TOKEN, "user": {"username": "admin"}}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # Check Authentication for other POST requests
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer ') or auth_header.split(' ')[1] != ADMIN_TOKEN:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Unauthorized"}).encode('utf-8'))
            return

        # API: Upload Avatar
        if path == '/api/upload/avatar':
            # Parse Multipart
            content_type = self.headers.get('Content-Type')
            if not content_type or 'multipart/form-data' not in content_type:
                self.send_error(400, "Content-Type must be multipart/form-data")
                return

            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST',
                         'CONTENT_TYPE': self.headers['Content-Type'],
                         }
            )

            if 'file' in form:
                file_item = form['file']
                if file_item.filename:
                    # Create avatar dir
                    avatar_dir = os.path.join(UPLOADS_DIR, 'avatar')
                    if not os.path.exists(avatar_dir):
                        os.makedirs(avatar_dir)
                    
                    import time
                    import random
                    filename = f"avatar-{int(time.time())}{os.path.splitext(file_item.filename)[1]}"
                    file_path = os.path.join(avatar_dir, filename)
                    
                    with open(file_path, 'wb') as f:
                        f.write(file_item.file.read())
                    
                    avatar_url = f"/uploads/avatar/{filename}"
                    
                    # Update profile
                    with open(DATA_FILE, 'r+', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'profile' not in data:
                            data['profile'] = {}
                        data['profile']['avatar'] = avatar_url
                        f.seek(0)
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        f.truncate()
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "url": avatar_url}).encode('utf-8'))
                    return
            
            self.send_error(400, "No file uploaded")
            return

        # API: Upload Work
        if path.startswith('/api/works/'):
            category = path.split('/')[-1]
            
            # Parse Multipart
            content_type = self.headers.get('Content-Type')
            if not content_type or 'multipart/form-data' not in content_type:
                self.send_error(400, "Content-Type must be multipart/form-data")
                return

            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST',
                         'CONTENT_TYPE': self.headers['Content-Type'],
                         }
            )

            # Extract fields
            title = form.getvalue('title')
            description = form.getvalue('description', '')
            width = form.getvalue('width', 0)
            height = form.getvalue('height', 0)
            
            file_item = form['file']
            
            if file_item.filename:
                # Create category dir in uploads
                cat_dir = os.path.join(UPLOADS_DIR, category)
                if not os.path.exists(cat_dir):
                    os.makedirs(cat_dir)
                
                # Generate unique filename
                import time
                import random
                filename = f"{int(time.time() * 1000)}-{random.randint(1000, 9999)}{os.path.splitext(file_item.filename)[1]}"
                file_path = os.path.join(cat_dir, filename)
                
                # Save file
                with open(file_path, 'wb') as f:
                    f.write(file_item.file.read())
                
                # Create work object
                work = {
                    "id": str(int(time.time() * 1000)),
                    "title": title,
                    "description": description,
                    "category": category,
                    "url": f"/uploads/{category}/{filename}",
                    "type": "video" if category in ['dance', 'video'] else "image", # Simplified type detection
                    "createTime": int(time.time() * 1000),
                    "width": int(width) if width else 0,
                    "height": int(height) if height else 0
                }
                
                # Better type detection
                mime = mimetypes.guess_type(filename)[0]
                if mime:
                    if mime.startswith('video'): work['type'] = 'video'
                    elif mime.startswith('image'): work['type'] = 'image'
                    elif 'pdf' in mime: work['type'] = 'pdf'
                
                # Handle cover for video
                if 'cover' in form:
                    cover_item = form['cover']
                    if cover_item.filename:
                        cover_filename = f"cover-{filename}.jpg"
                        cover_path = os.path.join(cat_dir, cover_filename)
                        with open(cover_path, 'wb') as f:
                            f.write(cover_item.file.read())
                        work['coverUrl'] = f"/uploads/{category}/{cover_filename}"

                # Update data.json
                with open(DATA_FILE, 'r+', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'works' not in data:
                        data['works'] = []
                    data['works'].append(work)
                    f.seek(0)
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.truncate()

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "work": work}).encode('utf-8'))
            else:
                self.send_error(400, "No file uploaded")
            return

        self.send_error(404, "API Endpoint not found")

    def do_PUT(self):
        # Check Authentication
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer ') or auth_header.split(' ')[1] != ADMIN_TOKEN:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Unauthorized"}).encode('utf-8'))
            return

        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # API: Update Profile
        if path == '/api/profile':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                profile_data = json.loads(post_data.decode('utf-8'))
                
                with open(DATA_FILE, 'r+', encoding='utf-8') as f:
                    data = json.load(f)
                    # Update profile fields
                    if 'profile' not in data:
                        data['profile'] = {}
                    
                    # Merge existing profile with new data
                    data['profile'].update(profile_data)
                    
                    f.seek(0)
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.truncate()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "profile": data['profile']}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))
            return

        self.send_error(404, "API Endpoint not found")

    def do_DELETE(self):
        # Check Authentication
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer ') or auth_header.split(' ')[1] != ADMIN_TOKEN:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Unauthorized"}).encode('utf-8'))
            return

        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/works/'):
            work_id = path.split('/')[-1]
            
            try:
                with open(DATA_FILE, 'r+', encoding='utf-8') as f:
                    data = json.load(f)
                    works = data.get('works', [])
                    
                    # Find and remove work
                    new_works = [w for w in works if str(w.get('id')) != work_id]
                    
                    if len(new_works) < len(works):
                        data['works'] = new_works
                        f.seek(0)
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        f.truncate()
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                    else:
                        self.send_error(404, "Work not found")
            except Exception as e:
                self.send_error(500, str(e))
            return
            
        self.send_error(404, "API Endpoint not found")

# Start Server
try:
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down server...")
    sys.exit(0)
