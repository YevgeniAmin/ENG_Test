import json
import os
import argparse
from datetime import datetime

# ==============================================================================
# ENG-PORTAL: NotebookLM Knowledge Base Updater
# Architecture: Python CLI Tool for Local Proxmox/Docker CI/CD Automation
# Purpose: Compiles raw markdown notes or JSON strings directly into the 
#          notebook-simulator.js database without manual HTML/JS editing.
# ==============================================================================

JS_FILE_PATH = "public/assets/js/notebook-simulator.js"

def load_current_js(file_path):
    """Reads the current JS file and extracts the knowledge base string."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"[ERROR] Could not find {file_path}. Are you running this from the project root?")
        return None

def extract_json_from_js(js_content):
    """Locates the JSON object inside the JS file."""
    start_marker = "const notebookKnowledgeBase = {"
    end_marker = "};"
    
    start_idx = js_content.find(start_marker)
    if start_idx == -1:
        print("[ERROR] Could not find 'notebookKnowledgeBase' object in JS file.")
        return None, None, None
        
    # We add the length of the marker to start index, but want to keep the bracket
    json_start = start_idx + len("const notebookKnowledgeBase = ")
    
    # Find the end of the JSON object (closing brace before the first semicolon)
    # This is a simple parser, assuming no nested }; at the root level.
    substring = js_content[json_start:]
    json_end_relative = substring.find("};")
    
    if json_end_relative == -1:
        print("[ERROR] Could not find the end of the JSON object.")
        return None, None, None
        
    json_end = json_start + json_end_relative + 1 # include the }
    
    json_str = js_content[json_start:json_end]
    
    return json_str, start_idx, json_end + 1 # +1 for the semicolon

def update_knowledge_base(js_file_path, new_category, title, source, insights):
    """Updates the JS file with new knowledge base entries."""
    js_content = load_current_js(js_file_path)
    if not js_content:
        return False
        
    json_str, start_idx, end_idx = extract_json_from_js(js_content)
    if not json_str:
        return False

    try:
        # Parse existing database
        kb_data = json.loads(json_str)
        
        # Check if category exists, if not create it
        category_key = new_category.lower().replace(" ", "-")
        
        if category_key not in kb_data:
            kb_data[category_key] = {
                "title": title,
                "source": f"Source: {source} (Auto-Updated: {datetime.now().strftime('%Y-%m-%d')})",
                "insights": []
            }
        
        # Append new insights
        if isinstance(insights, list):
            kb_data[category_key]["insights"].extend(insights)
        else:
            kb_data[category_key]["insights"].append(insights)
            
        # Serialize back to formatted JSON
        new_json_str = json.dumps(kb_data, indent=4, ensure_ascii=False)
        
        # Reconstruct the JS file
        new_js_content = js_content[:start_idx] + "const notebookKnowledgeBase = " + new_json_str + ";" + js_content[end_idx:]
        
        # Save file
        with open(js_file_path, "w", encoding="utf-8") as f:
            f.write(new_js_content)
            
        print(f"[SUCCESS] Updated {category_key} in notebook-simulator.js")
        return True
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse existing JSON in JS file: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update ENG-Portal NotebookLM Simulator Data")
    parser.add_argument("--category", required=True, help="Category ID (e.g., 'hardware-ops')")
    parser.add_argument("--title", required=True, help="Display Title for the dropdown")
    parser.add_argument("--source", required=True, help="Source document name")
    parser.add_argument("--insight", required=True, action="append", help="A single bullet point insight (can be used multiple times)")
    
    args = parser.parse_args()
    
    update_knowledge_base(JS_FILE_PATH, args.category, args.title, args.source, args.insight)
