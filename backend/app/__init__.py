from flask import Flask, request, jsonify, send_from_directory
import os, cv2 
from flask_cors import CORS
from random import randint
from scripts.methods import ( init, verify_token, upload_file_to_storage, update_video_firestore
                            ,get_userData_from_firestore)
# import scripts.methods
from uuid import uuid4
from scripts.sms import sms_emg

app = Flask(__name__)
CORS(app)
init()

# Define the folder where uploaded files will be saved
UPLOAD_FOLDER = '../DOWNLOAD'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Flask to save uploaded files in the specified folder
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST'])
def upload_video():
    # Check if the 'video' file is part of the request
    if 'video' not in request.files:
        return jsonify({"error": "No video file part"}), 400
    
    # Get the video file from the request
    video_file = request.files['video']
    authentication = verify_token(request.headers["Autherization"])


    # If no file was selected
    if video_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the file to the UPLOAD_FOLDER
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], video_file.filename)
    video_file.save(file_path)

    storage_path = f"videos/{authentication['uid']}/{uuid4()}.mov"
    blob = upload_file_to_storage(file_path, storage_path)
    # video_url = blob.public_url
    update_video_firestore(storage_path, authentication['uid'])
    
    ################################

    # cap = cv2.VideoCapture(file_path)

    # # Chqeck if camera opened successfully
    # if (cap.isOpened()== False):
    #     print("Error opening video file")

    # # Read until video is completed
    # while(cap.isOpened()):
        
    # # Capture frame-by-frame
    #     ret, frame = cap.read()
    #     if ret == True:
    #     # Display the resulting frame
    #         cv2.imshow('Frame', frame)
            
    #     # Press Q on keyboard to exit
    #         if cv2.waitKey(25) & 0xFF == ord('q'):
    #             break

    # # Break the loop
    #     else:
    #         break

    # # When everything done, release
    # # the video capture object
    # cap.release()

    # # Closes all the frames
    # cv2.destroyAllWindows()


    ###############################


    return jsonify({"message": "Video uploaded successfully!", "file_path": file_path}), 200

@app.route('/data', methods=['POST'])
def get_data():
    i = randint(10,20)
    authentication = verify_token(request.headers["Autherization"])
    uid = authentication['uid']
    user_data = get_userData_from_firestore(uid)
    print(user_data['emg_name'], user_data['emg_phone'])
    # sms_emg(user_data['emg_name'],user_data['emg_phone'], user_data['name'])
    return jsonify({
        'status': 'success',
        'waitDuration': i
    }), 200


if __name__ == "__main__":
    app.run(host = "0.0.0.0")
