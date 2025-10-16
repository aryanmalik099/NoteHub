import firebase_admin
from firebase_admin import credentials, storage
from werkzeug.utils import secure_filename
import os
import uuid
from urllib.parse import unquote, urlparse


def upload_file_to_firebase(file, filename, content_type):
    try:
        bucket = storage.bucket()
        original_filename = secure_filename(filename)
        _, file_extension = os.path.splitext(original_filename)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        blob = bucket.blob(unique_filename)
        file.seek(0)
        blob.upload_from_file(file, content_type=content_type)
        
        blob.make_public()
        
        print("New file uploaded with URL:", blob.public_url)
        
        return blob.public_url
    
    except Exception as e:
        print(f"Error uploading file to Firebase: {e}")
        return None


def delete_file_from_firebase(file_url):
    if not file_url:
        print("Warning: No file URL provided to delete.")
        return False
        
    try:
        bucket = storage.bucket() 
        
        parsed_url = urlparse(file_url)

        object_name_encoded = parsed_url.path.split('/')[-1]
        
        object_name = unquote(object_name_encoded)

        if not object_name:
            raise ValueError(f"Could not extract a valid object name from URL: {file_url}")

        print(f"Attempting to delete object: '{object_name}' from Firebase Storage.")
        
        blob = bucket.blob(object_name)
        
        if blob.exists():
            blob.delete()
            print(f"Successfully deleted '{object_name}' from Firebase Storage.")
            return True
        else:
            print(f"Warning: Object '{object_name}' not found in Firebase Storage. It may have been deleted already.")
            return True

    except Exception as e:
        print(f"Error deleting file from Firebase: {e}")
        return False