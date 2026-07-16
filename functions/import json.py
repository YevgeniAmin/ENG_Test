import json
import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# הגדרות לוגים
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# קבועים - כדאי להעביר למשתני סביבה (Environment Variables)
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
# מזהה התיקייה שסיפקת: 1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv
FOLDER_ID = os.getenv('DRIVE_FOLDER_ID', '1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv')
SERVICE_ACCOUNT_FILE = 'credentials.json' 
OUTPUT_PATH = 'public/versions.js'

def get_drive_service():
    """התחברות ל-API של Google Drive"""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        logging.error(f"Missing credentials file at {SERVICE_ACCOUNT_FILE}")
        raise FileNotFoundError("Credentials file not found.")

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('drive', 'v3', credentials=creds)

def fetch_files_metadata(service):
    """שליפת רשימת קבצים עם פרטי גרסה ותאריך"""
    try:
        query = f"'{FOLDER_ID}' in parents and trashed = false and mimeType = 'text/html'"
        logging.info(f"Fetching HTML files from folder: {FOLDER_ID}")
        
        results = service.files().list(
            q=query,
            fields="files(id, name, modifiedTime, version, webViewLink)",
            orderBy="modifiedTime desc" # מיון מהחדש לישן כבר ברמת ה-API
        ).execute()
        
        return results.get('files', [])
    except HttpError as error:
        logging.error(f"An error occurred: {error}")
        return []

def process_registry(files):
    """עיבוד הנתונים למבנה נקי עבור ה-JS"""
    portal_registry = {
        "metadata": {
            "generatedAt": None,
            "totalFiles": len(files)
        },
        "items": {}
    }
    
    for file in files:
        name = file.get('name')
        # ניקוי סיומת וטיפול בתווים בעיתיים בשם המפתח
        key_name = name.replace('.html', '').replace(' ', '_')
        
        raw_date = file.get('modifiedTime')
        # פורמט תאריך קריא יותר: YYYY-MM-DD HH:MM
        clean_date = raw_date.replace('T', ' ').split('.')[0] if raw_date else "N/A"
        
        portal_registry["items"][key_name] = {
            "fileName": name,
            "version": file.get('version', '1'),
            "lastModified": clean_date,
            "driveId": file.get('id'),
            "url": file.get('webViewLink')
        }
        
    return portal_registry

def save_js_file(registry):
    """שמירת הקובץ כפורמט JavaScript Module"""
    try:
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        # המרה ל-JSON
        json_str = json.dumps(registry, indent=4, ensure_ascii=False)
        
        # יצירת קובץ JS בתצורת Constant - קל לייבוא ב-Frontend
        js_content = f"// Generated automatically - do not edit manually\n"
        js_content += f"const portalRegistry = {json_str};\n\n"
        js_content += f"export default portalRegistry;"

        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        logging.info(f"Success! Registry saved to {OUTPUT_PATH}")
    except Exception as e:
        logging.error(f"Failed to write file: {e}")

if __name__ == '__main__':
    try:
        drive_service = get_drive_service()
        files_data = fetch_files_metadata(drive_service)
        
        if not files_data:
            logging.warning("No HTML files found in the specified folder.")
        else:
            registry_data = process_registry(files_data)
            save_js_file(registry_data)
            
    except Exception as e:
        logging.critical(f"Process failed: {e}")
import json
import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# הגדרות לוגים
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# קבועים - כדאי להעביר למשתני סביבה (Environment Variables)
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
# מזהה התיקייה שסיפקת: 1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv
FOLDER_ID = os.getenv('DRIVE_FOLDER_ID', '1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv')
SERVICE_ACCOUNT_FILE = 'credentials.json' 
OUTPUT_PATH = 'public/assets/js/versions.js'

def get_drive_service():
    """התחברות ל-API של Google Drive"""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        logging.error(f"Missing credentials file at {SERVICE_ACCOUNT_FILE}")
        raise FileNotFoundError("Credentials file not found.")

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('drive', 'v3', credentials=creds)

def fetch_files_metadata(service):
    """שליפת רשימת קבצים עם פרטי גרסה ותאריך"""
    try:
        query = f"'{FOLDER_ID}' in parents and trashed = false and mimeType = 'text/html'"
        logging.info(f"Fetching HTML files from folder: {FOLDER_ID}")
        
        results = service.files().list(
            q=query,
            fields="files(id, name, modifiedTime, version, webViewLink)",
            orderBy="modifiedTime desc" # מיון מהחדש לישן כבר ברמת ה-API
        ).execute()
        
        return results.get('files', [])
    except HttpError as error:
        logging.error(f"An error occurred: {error}")
        return []

def process_registry(files):
    """עיבוד הנתונים למבנה נקי עבור ה-JS"""
    portal_registry = {
        "metadata": {
            "generatedAt": None,
            "totalFiles": len(files)
        },
        "items": {}
    }
    
    for file in files:
        name = file.get('name')
        # ניקוי סיומת וטיפול בתווים בעיתיים בשם המפתח
        key_name = name.replace('.html', '').replace(' ', '_')
        
        raw_date = file.get('modifiedTime')
        # פורמט תאריך קריא יותר: YYYY-MM-DD HH:MM
        clean_date = raw_date.replace('T', ' ').split('.')[0] if raw_date else "N/A"
        
        portal_registry["items"][key_name] = {
            "fileName": name,
            "version": file.get('version', '1'),
            "lastModified": clean_date,
            "driveId": file.get('id'),
            "url": file.get('webViewLink')
        }
        
    return portal_registry

def save_js_file(registry):
    """שמירת הקובץ כפורמט JavaScript Module"""
    try:
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        # המרה ל-JSON
        json_str = json.dumps(registry, indent=4, ensure_ascii=False)
        
        # יצירת קובץ JS בתצורת Constant - קל לייבוא ב-Frontend
        js_content = f"// Generated automatically - do not edit manually\n"
        js_content += f"const portalRegistry = {json_str};\n\n"
        js_content += f"export default portalRegistry;"

        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        logging.info(f"Success! Registry saved to {OUTPUT_PATH}")
    except Exception as e:
        logging.error(f"Failed to write file: {e}")

if __name__ == '__main__':
    try:
        drive_service = get_drive_service()
        files_data = fetch_files_metadata(drive_service)
        
        if not files_data:
            logging.warning("No HTML files found in the specified folder.")
        else:
            registry_data = process_registry(files_data)
            save_js_file(registry_data)
            
    except Exception as e:
        logging.critical(f"Process failed: {e}")
