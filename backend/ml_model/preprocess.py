# Step 1: Import Required Libraries
import cv2
import os
import dlib
import numpy as np
import pandas as pd
import glob
import random
from imutils import face_utils

# Load face detection and landmark models
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("./data/shape_predictor_68_face_landmarks.dat")

# Step 2: Define Paths for Datasets
DATA_PATHS = {
    "yawdd": "./data/yawdd/Mirror",
    "eye_state": "./data/eye_state/train/",
    "ddd_faces": "./data/ddd/Driver Drowsiness Dataset (DDD)/",
    "uta_rldd": "./data/uta_rldd/"
}

# Define output directory and create subfolders
PROCESSED_DATA_PATH = "./processed_data/"
SUBFOLDERS = ["yawdd", "eye_state", "ddd", "uta_rldd"]
for folder in SUBFOLDERS:
    os.makedirs(os.path.join(PROCESSED_DATA_PATH, folder), exist_ok=True)


# Step 3: Preprocessing Functions for Each Dataset
data_list = []

def calculate_mar(landmarks):
    mouth = landmarks[48:68]
    A = np.linalg.norm(mouth[13] - mouth[19])
    B = np.linalg.norm(mouth[14] - mouth[18])
    C = np.linalg.norm(mouth[15] - mouth[17])
    D = np.linalg.norm(mouth[12] - mouth[16])
    mar = (A + B + C) / (3.0 * D)
    return mar

def extract_frames(video_path, dataset_name, subfolder, frame_interval=30, label=None, max_frames=None):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    saved_frames = 0
    video_name = os.path.basename(video_path).split(".")[0]
    dataset_folder = os.path.join(PROCESSED_DATA_PATH, dataset_name, subfolder)
    os.makedirs(dataset_folder, exist_ok=True)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_interval == 0:
            if max_frames is not None and saved_frames >= max_frames:
                break
            save_path = os.path.join(dataset_folder, f"{video_name}_frame{frame_count}.jpg")
            cv2.imwrite(save_path, frame)
            data_list.append([save_path, label, dataset_name])
            saved_frames += 1
        frame_count += 1
    cap.release()

def extract_yawn_frames(video_path, dataset_name, subfolder, frame_interval=30, label=None, mar_threshold=0.45):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    video_name = os.path.basename(video_path).split(".")[0]
    dataset_folder = os.path.join(PROCESSED_DATA_PATH, dataset_name, subfolder)
    os.makedirs(dataset_folder, exist_ok=True)

    valid_frames = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = detector(gray)

            if len(faces) > 0:
                shape = predictor(gray, faces[0])
                shape = face_utils.shape_to_np(shape)
                mar = calculate_mar(shape)

                if mar > mar_threshold:
                    valid_frames.append((frame.copy(), frame_count))
        frame_count += 1
    cap.release()

    for idx, (frame, frame_idx) in enumerate(valid_frames):
        save_path = os.path.join(dataset_folder, f"{video_name}_frame{frame_idx}.jpg")
        cv2.imwrite(save_path, frame)
        data_list.append([save_path, label, dataset_name])

def process_uta_videos(dataset_path):
    video_paths = glob.glob(os.path.join(dataset_path, "**", "*.mov"), recursive=True)
    total_videos = 0

    for video_path in video_paths:
        video_name = os.path.basename(video_path)

        if "0.mov" in video_name:
            label = "alert"
        elif "5.mov" in video_name:
            label = "low_vigilant"
        elif "10.mov" in video_name:
            label = "drowsy"
        else:
            continue

        extract_frames(video_path, dataset_name="ddd", subfolder=label, frame_interval=10, label=label)
        total_videos += 1

    print(f"Processed {total_videos} UTA videos into ./processed_data/ddd/<label>/")

def process_ddd_images(dataset_path):
    processed_ddd_dir = os.path.join(PROCESSED_DATA_PATH, "ddd")
    os.makedirs(processed_ddd_dir, exist_ok=True)

    total_images = 0
    for category in ["Drowsy", "Non Drowsy"]:
        category_path = os.path.join(dataset_path, category)
        if not os.path.exists(category_path):
            print(f"⚠️ Warning: {category_path} does not exist.")
            continue

        image_paths = glob.glob(os.path.join(category_path, "*.*"))
        image_paths = [img for img in image_paths if img.lower().endswith(('.jpg', '.jpeg', '.png'))]

        label = "drowsy" if "Drowsy" in category else "alert"
        category_output_dir = os.path.join(processed_ddd_dir, label)
        os.makedirs(category_output_dir, exist_ok=True)

        for img_path in image_paths:
            save_path = os.path.join(category_output_dir, os.path.basename(img_path))
            cv2.imwrite(save_path, cv2.imread(img_path))
            data_list.append([save_path, label, "ddd"])

        total_images += len(image_paths)

    print(f"Processed {total_images} DDD images")

def process_yawdd_mirror_videos(dataset_path):
    mirror_folders = ["Female_mirror", "Male_mirror Avi Videos"]
    total_processed = 0

    for folder in mirror_folders:
        full_path = os.path.join(dataset_path, folder)
        video_paths = glob.glob(os.path.join(full_path, "*.avi"))

        for video_path in video_paths:
            video_name = os.path.basename(video_path)
            if "normal" in video_name.lower():
                label = "normal"
            elif "talking" in video_name.lower() in video_name.lower():
                label = "talking"
            elif "yawning" in video_name.lower() in video_name.lower():
                label = "yawning"
            else:
                print(f"Skipping unlabeled video: {video_name}")
                continue

            if label == "yawning":
                extract_yawn_frames(
                    video_path, dataset_name="yawdd", subfolder=label,
                    frame_interval=10, label=label, mar_threshold=0.42
                )
            else:
                extract_frames(
                    video_path, dataset_name="yawdd", subfolder=label,
                    frame_interval=10, label=label
                )
            total_processed += 1

    print(f"Processed {total_processed} videos from YawDD mirror folders")

def process_eye_state_images(dataset_path):
    processed_eye_dir = os.path.join(PROCESSED_DATA_PATH, "eye_state")
    os.makedirs(processed_eye_dir, exist_ok=True)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    data_counts = {"closed": 0, "open": 0}
    all_data = {"closed": [], "open": []}

    for category in ["Closed_Eyes", "Open_Eyes"]:
        category_path = os.path.join(dataset_path, category)
        if not os.path.exists(category_path):
            print(f"Warning: {category_path} does not exist.")
            continue

        image_paths = glob.glob(os.path.join(category_path, "*.*"))
        image_paths = [img for img in image_paths if img.lower().endswith(('.jpg', '.jpeg', '.png'))]

        label = "closed" if "Closed_Eyes" in category else "open"
        category_output_dir = os.path.join(processed_eye_dir, label)
        os.makedirs(category_output_dir, exist_ok=True)

        for img_path in image_paths:
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            enhanced_img = clahe.apply(img)
            enhanced_img = cv2.cvtColor(enhanced_img, cv2.COLOR_GRAY2BGR)  
            save_path = os.path.join(category_output_dir, os.path.basename(img_path))
            cv2.imwrite(save_path, enhanced_img)
            all_data[label].append([save_path, label, "eye_state"])
            data_counts[label] += 1

    print(f"Closed: {data_counts['closed']} | Open: {data_counts['open']}")

    min_class = min(data_counts, key=data_counts.get)
    max_class = max(data_counts, key=data_counts.get)
    diff = data_counts[max_class] - data_counts[min_class]

    if diff > 0:
        print(f"Balancing by duplicating {min_class} images...")
        duplicates = random.choices(all_data[min_class], k=diff)
        for entry in duplicates:
            src = entry[0]
            dup_name = os.path.basename(src).replace(".", f"_dup.")
            dst = os.path.join(processed_eye_dir, min_class, dup_name)
            cv2.imwrite(dst, cv2.imread(src))
            all_data[min_class].append([dst, min_class, "eye_state"])

    for label in all_data:
        data_list.extend(all_data[label])

    total = data_counts["closed"] + data_counts["open"]
    print(f"Processed {total} eye state images (balanced)")

process_yawdd_mirror_videos(DATA_PATHS["yawdd"])
process_eye_state_images(DATA_PATHS["eye_state"])
process_ddd_images(DATA_PATHS["ddd_faces"])
process_uta_videos(DATA_PATHS["uta_rldd"])

df = pd.DataFrame(data_list, columns=["image_path", "label", "type"])
df.to_csv(os.path.join(PROCESSED_DATA_PATH, "processed_data.csv"), index=False)
print("Dataset processing completed!")
