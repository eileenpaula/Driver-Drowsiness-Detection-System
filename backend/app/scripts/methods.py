
import cv2
import firebase_admin
from firebase_admin import credentials, storage, auth, firestore
from dotenv import load_dotenv
import os, time
import requests



# Initialize Firebase Admin SDK with your service account key
def init(): #could get removed int he future
    file_path = "C:\\Users\\NeoPancakeFiles\\Desktop\\FIU\\SEMESTERS\\2025 Spring"
    load_dotenv(dotenv_path=f"{file_path}\\Driver-Drowsiness-Detection-System\\app\\.env")

    cred = credentials.Certificate(os.getenv("CONF_JSON"))
    firebase_admin.initialize_app(cred, {
        'storageBucket': os.getenv("EXPO_PUBLIC_STROAGE_BUCKET") 
    })

#############################################
# Function to download .mov files from Firebase Storage
def download_video_from_storage(file_path):
    """
    Downloads a video file from Firebase Storage using the given file path.
    """
    # Reference to the Firebase Storage bucket
    bucket = storage.bucket()

    # Extract the file name from the path (after the last '/')
    file_name = file_path.split('/')[-1]

    # Folder where you want to save the videos locally
    download_folder = 'downloaded_videos'
    
    # Ensure the download folder exists
    if not os.path.exists(download_folder):
        os.makedirs(download_folder)

    # Set the local path where the file will be downloaded
    local_file_path = os.path.join(download_folder, file_name)

    # Download the file from Firebase Storage
    print(f"Downloading {file_name}...")
    blob = bucket.blob(file_path)
    
    # Download the file to the local path
    blob.download_to_filename(local_file_path)

    print(f"File {file_name} downloaded successfully.")

def get_data_from_firestore(uid):
    db = firestore.client()
    # Reference to your collection (replace 'your-collection-name' with your collection's name)
    collection_ref = db.collection('users').document(uid).collection('videos')
    print(collection_ref)
    # Fetch all documents in the collection
    query = collection_ref.order_by('time_stored', direction=firestore.Query.DESCENDING).limit(1)

    # Fetch the document
    docs = query.stream()
    doc = next(docs, None)
    video_path = doc.to_dict()['file_path']
    return video_path
#############################################

def get_userData_from_firestore(uid):
    db = firestore.client()
    # Reference to your collection (replace 'your-collection-name' with your collection's name)
    collection_ref = db.collection('users').document(uid)
    print(collection_ref)
    # Fetch all documents in the collection
    # query = collection_ref.order_by('time_stored', direction=firestore.Query.DESCENDING).limit(1)

    # Fetch the document
    # docs = query.stream()
    doc = collection_ref.get()
    video_path = doc.to_dict()
    return video_path


def verify_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # This returns the decoded token with user details
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

# Upload a file to Firebase Storage
def upload_file_to_storage(file_path, storage_path):
    # Reference to the Firebase Storage bucket
    bucket = storage.bucket()

    # Create a blob (representing the file) in Firebase Storage
    blob = bucket.blob(storage_path)

    # Upload the file
    blob.upload_from_filename(file_path)

    print(f"File {file_path} uploaded to {storage_path}")

    return blob

def update_video_firestore(video_path, user_id):
    current_time = time.strftime("%H:%M:%S", time.localtime())

        # Step 6: Save metadata about the video in Firestore
    db = firestore.client()
    video_ref = db.collection('users').document(user_id).collection('videos').document()
    video_ref.set({
        'file_path': video_path,
        'time_stored': current_time,
    })

def get_url_and_time(user_id):
    # db = firestore.Client()
    pass

    # Reference to the user's video collection in Firestore
    # video_ref = db.collection('users').document(user_id).collection('videos')

    # # Get the most recent video (or use other criteria depending on your use case)
    # video_snapshot = video_ref.order_by('uploadedAt', direction=firestore.Query.DESCENDING).limit(1).get()

    # # If we found a video
    # if video_snapshot:
    #     video_data = video_snapshot[0].to_dict()
    #     return video_data['videoUrl']  # Return the video URL
    # else:
    #     return None
    
# print(get_url_and_time("4XEvWLwTiaQfz6FSF1jk2uZHJxI3"))


def preprocess(video, width=240, height=240):
    """
    Resizes a video file while maintaining the aspect ratio, given the video file object.
    
    Parameters:
    - video_file (file-like object): The video file object.
    - width (int, optional): The desired width of the resized video (in pixels).
    - height (int, optional): The desired height of the resized video (in pixels).
    
    Returns:
    - output_video (str): The path of the resized video.
    """
    # Open the video file using OpenCV
    cap = cv2.VideoCapture(video)

    if not cap.isOpened():
        raise ValueError("Error: Unable to open the video file.")

    # Get the original video frame rate (FPS) and size (width, height)
    fps = cap.get(cv2.CAP_PROP_FPS)
    original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # If both width and height are None, raise an error
    if width is None and height is None:
        raise ValueError("Either width or height must be specified.")

    # Calculate the new width and height
    if width is not None and height is not None:
        # If both width and height are provided, just use them
        new_width = width
        new_height = height
    elif width is not None:
        # If only width is provided, calculate height to maintain aspect ratio
        aspect_ratio = original_height / original_width
        new_width = width
        new_height = int(width * aspect_ratio)
    elif height is not None:
        # If only height is provided, calculate width to maintain aspect ratio
        aspect_ratio = original_width / original_height
        new_height = height
        new_width = int(height * aspect_ratio)

    # Define the codec and create a VideoWriter object to store the resized video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec for MP4 format
    output_path = 'resized_video.mp4'  # Output file name
    out = cv2.VideoWriter(output_path, fourcc, fps, (new_width, new_height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Resize each frame to the new dimensions
        resized_frame = cv2.resize(frame, (new_width, new_height))
        
        # Write the resized frame to the output video
        out.write(resized_frame)

    # Release the video capture and writer objects
    cap.release()
    out.release()

    print(f"Video resized successfully and saved at {output_path}")

    return output_path


# if __name__ == "__main__":
#     init()
#     print(get_userData_from_firestore("4XEvWLwTiaQfz6FSF1jk2uZHJxI3"))
    # download_video_from_storage(get_data_from_firestore("4XEvWLwTiaQfz6FSF1jk2uZHJxI3"))