import firebase_admin
from firebase_admin import credentials, storage
from werkzeug.utils import secure_filename
import os
import uuid
from urllib.parse import unquote, urlparse

# --- Assume Firebase has already been initialized ---

def upload_file_to_firebase(file):
    """Uploads a file to Firebase Storage and returns its public URL."""
    try:
        bucket = storage.bucket()
        original_filename = secure_filename(file.filename)
        _, file_extension = os.path.splitext(original_filename)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        blob = bucket.blob(unique_filename)
        blob.upload_from_file(file, content_type=file.content_type)
        
        # This is the critical part: make the blob public and get its URL
        blob.make_public()
        
        # Print the URL to confirm it's correct
        print("New file uploaded with URL:", blob.public_url)
        
        return blob.public_url # This is the correct URL to save
    
    except Exception as e:
        print(f"Error uploading file to Firebase: {e}")
        return None


def delete_file_from_firebase(file_url):
    """
    Deletes a file from Firebase Storage using its public URL.
    Handles multiple Firebase/GCS URL formats.
    """
    if not file_url:
        print("Warning: No file URL provided to delete.")
        return False
        
    try:
        bucket = storage.bucket() 
        
        # Parse the URL to safely extract the path component
        parsed_url = urlparse(file_url)
        
        # The object name is simply the last part of the URL's path.
        # This is a more robust method that works for various URL formats.
        # e.g., /my-bucket/my-file.jpg -> my-file.jpg
        # e.g., /v0/b/my-bucket/o/my-file.jpg -> my-file.jpg
        object_name_encoded = parsed_url.path.split('/')[-1]
        
        # URL-decode the object name to handle special characters (e.g., %20 for spaces)
        object_name = unquote(object_name_encoded)

        if not object_name:
            raise ValueError(f"Could not extract a valid object name from URL: {file_url}")

        print(f"Attempting to delete object: '{object_name}' from Firebase Storage.")
        
        blob = bucket.blob(object_name)
        
        # Check if the file exists before trying to delete it
        if blob.exists():
            blob.delete()
            print(f"Successfully deleted '{object_name}' from Firebase Storage.")
            return True
        else:
            # If the file is already gone, we can consider the job done.
            print(f"Warning: Object '{object_name}' not found in Firebase Storage. It may have been deleted already.")
            return True

    except Exception as e:
        print(f"Error deleting file from Firebase: {e}")
        return False