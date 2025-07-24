from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import os
import fnmatch
import subprocess
import sys
from typing import List, Optional
import difflib
from datetime import datetime

router = APIRouter()

class OpenRequest(BaseModel):
    query: str
    search_paths: Optional[List[str]] = None  # Optionally restrict search

class OpenResponse(BaseModel):
    status: str
    message: str
    matches: Optional[List[str]] = None

class FileMatch(BaseModel):
    name: str
    path: str
    last_modified: str

class FileSearchRequest(BaseModel):
    query: str
    search_paths: Optional[List[str]] = None
    extensions: Optional[List[str]] = None  # e.g., ["pdf", "docx"]
    max_results: int = 10

class FileSearchResponse(BaseModel):
    matches: List[FileMatch]

@router.post("/agent/open", response_model=OpenResponse)
async def open_file_or_app(request: OpenRequest):
    """
    Open a file or application by name. Searches user directories and system PATH.
    Only works on Windows (uses os.startfile).
    """
    query = request.query.strip().lower()
    search_paths = request.search_paths or [
        os.path.expanduser("~"),
        os.path.join(os.path.expanduser("~"), "Documents"),
        os.path.join(os.path.expanduser("~"), "Downloads"),
        os.path.join(os.path.expanduser("~"), "Desktop"),
        "C:\\Program Files",
        "C:\\Program Files (x86)",
        "C:\\Windows\\System32"
    ]
    matches = []
    # Search for file
    for base in search_paths:
        for root, dirs, files in os.walk(base):
            for name in files:
                if query in name.lower():
                    matches.append(os.path.join(root, name))
            # Limit search depth for performance
            if root.count(os.sep) - base.count(os.sep) > 3:
                del dirs[:]
    # If not found as file, try as app in PATH
    if not matches:
        for path in os.environ.get("PATH", "").split(os.pathsep):
            exe = os.path.join(path, query)
            if os.path.isfile(exe):
                matches.append(exe)
    if not matches:
        return OpenResponse(status="not_found", message=f"No file or app found matching '{query}'.")
    # Open the first match
    try:
        if sys.platform == "win32":
            os.startfile(matches[0])
        else:
            subprocess.Popen([matches[0]])
        return OpenResponse(status="opened", message=f"Opened: {matches[0]}", matches=matches)
    except Exception as e:
        return OpenResponse(status="error", message=f"Failed to open: {str(e)}", matches=matches)

@router.post("/agent/search_file", response_model=FileSearchResponse)
async def search_file(request: FileSearchRequest):
    query = request.query.strip().lower()
    search_paths = request.search_paths or [
        os.path.expanduser("~"),
        os.path.join(os.path.expanduser("~"), "Documents"),
        os.path.join(os.path.expanduser("~"), "Downloads"),
        os.path.join(os.path.expanduser("~"), "Desktop")
    ]
    extensions = request.extensions or ["pdf", "docx", "doc", "txt"]
    all_files = []
    for base in search_paths:
        for root, dirs, files in os.walk(base):
            for name in files:
                ext = name.split(".")[-1].lower()
                if ext in extensions:
                    all_files.append((name, os.path.join(root, name)))
            if root.count(os.sep) - base.count(os.sep) > 3:
                del dirs[:]
    # Fuzzy match
    names = [name for name, _ in all_files]
    close = difflib.get_close_matches(query, names, n=request.max_results, cutoff=0.4)
    matches = []
    for name, path in all_files:
        if name in close or query in name.lower():
            try:
                last_modified = datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
            except Exception:
                last_modified = "unknown"
            matches.append(FileMatch(name=name, path=path, last_modified=last_modified))
    matches = sorted(matches, key=lambda m: m.last_modified, reverse=True)[:request.max_results]
    return FileSearchResponse(matches=matches) 