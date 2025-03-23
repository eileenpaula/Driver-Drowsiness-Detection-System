from flask import Flask, request, jsonify, send_from_directory
import os, cv2
from flask_cors import CORS
from random import randint


app = Flask(__name__)
CORS(app)

# Define the folder where uploaded files will be saved
UPLOAD_FOLDER = '<YOUR DOWNLOAD FOLDER>'
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


    # If no file was selected
    if video_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the file to the UPLOAD_FOLDER
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], video_file.filename)
    video_file.save(file_path)

    
    ################################

    cap = cv2.VideoCapture(file_path)

    # Chqeck if camera opened successfully
    if (cap.isOpened()== False):
        print("Error opening video file")

    # Read until video is completed
    while(cap.isOpened()):
        
    # Capture frame-by-frame
        ret, frame = cap.read()
        if ret == True:
        # Display the resulting frame
            cv2.imshow('Frame', frame)
            
        # Press Q on keyboard to exit
            if cv2.waitKey(25) & 0xFF == ord('q'):
                break

    # Break the loop
        else:
            break

    # When everything done, release
    # the video capture object
    cap.release()

    # Closes all the frames
    cv2.destroyAllWindows()


    ################################



    return jsonify({"message": "Video uploaded successfully", "file_path": file_path}), 200

@app.route('/downloads/videotest', methods=['GET'])
def download_file(filename):
    # Provide the file to the user for download
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/video", methods=['GET', 'POST'])
def video():
    if(request.method == "POST"):
        bytesOfVideo = request.get_data()
        with open('video.mp4', 'wb') as out:
            out.write(bytesOfVideo)
        return "Video read"

@app.route('/data', methods=['GET'])
def get_data():
    # Sample data to send to the frontend
    i = randint(1,10)
    print(i)
    data = {
        'status': 'success',
        'id': 10
    }
    
    # Return the data as a JSON response
    return jsonify(data)


if __name__ == "__main__":
    app.run(host = "0.0.0.0")
