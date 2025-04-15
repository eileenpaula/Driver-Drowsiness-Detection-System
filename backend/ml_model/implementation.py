import tensorflow as tf
import numpy as np
import cv2, time, os, json
import matplotlib.pyplot as plt
import firebase_admin
from firebase_admin import credentials, firestore, storage
import tempfile

class DrowsinessDetector:
    def __init__(self, model_path):
        try:
            self.model = tf.keras.models.load_model(model_path)
            print("Model loaded successfully.")
            self.model.summary()
        except Exception as e:
            raise RuntimeError(f"Failed to load model from {model_path}: {e}")

        self.alertness_labels = ["Alert", "Low Vigilant", "Very Drowsy"]
        self.yawn_labels = ["Normal", "Talking", "Yawning"]
        self.eye_labels = ["Eyes Open", "Eyes Closed"]

    def preprocess_frame(self, frame):
        resized = cv2.resize(frame, (224, 224))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = rgb / 255.0
        return np.expand_dims(normalized, axis=0)

    def process_frame(self, frame):
        preprocessed = self.preprocess_frame(frame)
        predictions = self.model.predict(preprocessed, verbose=0)

        alertness_scores = predictions[0][0]
        yawn_scores = predictions[1][0]
        eye_scores = predictions[2][0]

        alertness_idx = np.argmax(alertness_scores)
        yawn_idx = np.argmax(yawn_scores)
        eye_idx = np.argmax(eye_scores)

        return {
            "timestamp": time.time(),
            "alertness": {
                "label": self.alertness_labels[alertness_idx],
                "index": alertness_idx,
                "confidence": float(alertness_scores[alertness_idx]),
                "raw_scores": alertness_scores.tolist()
            },
            "eyes": {
                "label": self.eye_labels[eye_idx],
                "closed": eye_idx == 1,
                "confidence": float(eye_scores[eye_idx]),
                "raw_scores": eye_scores.tolist()
            },
            "yawn": {
                "label": self.yawn_labels[yawn_idx],
                "yawning": self.yawn_labels[yawn_idx] == "Yawning",
                "confidence": float(yawn_scores[yawn_idx]),
                "raw_scores": yawn_scores.tolist()
            }
        }

    def annotate_frame(self, frame, results):
        annotated = frame.copy()
        h, w = annotated.shape[:2]

        overlay = annotated.copy()
        cv2.rectangle(overlay, (0, 0), (w, 150), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, annotated, 0.4, 0, annotated)

        cv2.putText(annotated, f"Alertness: {results['alertness']['label']} ({results['alertness']['confidence']:.2f})",
                    (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        eye_color = (0, 0, 255) if results['eyes']['closed'] else (0, 255, 0)
        cv2.putText(annotated, f"Eyes: {results['eyes']['label']} ({results['eyes']['confidence']:.2f})",
                    (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, eye_color, 2)

        yawn_color = (0, 0, 255) if results['yawn']['yawning'] else (0, 255, 0)
        cv2.putText(annotated, f"Yawn: {results['yawn']['label']} ({results['yawn']['confidence']:.2f})",
                    (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, yawn_color, 2)

        return annotated

    def process_video(self, video_path, output_path=None, display=False, sample_rate=1, max_frames=None):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video at {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        results = []
        frame_count = 0
        processed_frames = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % sample_rate != 0:
                continue

            result = self.process_frame(frame)
            results.append(result)

            annotated = self.annotate_frame(frame, result)

            if writer:
                writer.write(annotated)

            if display:
                cv2.imshow("Drowsiness Detection", annotated)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            processed_frames += 1
            if max_frames and processed_frames >= max_frames:
                break

        cap.release()
        if writer:
            writer.release()
        if display:
            cv2.destroyAllWindows()

        print(f"Processed {processed_frames} out of {total_frames} frames.")
        return results

    def analyze_video_results(self, results):
        if not results:
            return {"error": "No results to analyze."}

        total = len(results)
        alertness_labels = [r['alertness']['label'] for r in results]
        eyes_closed = sum(1 for r in results if r['eyes']['closed'])
        yawning = sum(1 for r in results if r['yawn']['yawning'])

        alertness_counts = {label: alertness_labels.count(label) for label in self.alertness_labels}
        alertness_percentages = {k: round(v / total * 100, 2) for k, v in alertness_counts.items()}

        # Plot alertness trend
        alertness_indices = [self.alertness_labels.index(label) for label in alertness_labels]
        plt.figure(figsize=(10, 4))
        plt.plot(alertness_indices, label='Alertness Level (0=Alert, 2=Very Drowsy)', color='blue')
        plt.title('Alertness Prediction Over Time')
        plt.xlabel('Frame Index')
        plt.ylabel('Alertness Level')
        plt.yticks([0, 1, 2], self.alertness_labels)
        plt.grid(True)
        plt.legend()
        plt.tight_layout()
        plt.show()

        return {
            "total_frames": total,
            "eyes_closed_frames": eyes_closed,
            "yawning_frames": yawning,
            "alertness_counts": alertness_counts,
            "alertness_percentages": alertness_percentages
        }
    
def analyze_pending_videos():
    cred = credentials.Certificate("serviceAccKey.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'drowsy-app-47252.appspot.com'
    })

    db = firestore.client()
    bucket = storage.bucket()
    detector = DrowsinessDetector("multi_task_drowsiness_model.h5")

    videos_ref = db.collection_group("videos")
    pending_videos = videos_ref.where("status", "==", "pending").stream()

    for doc in pending_videos:
        data = doc.to_dict()
        file_path = data["file_path"]
        print(f"📥 Processing video: {file_path}")

        blob = bucket.blob(file_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            blob.download_to_filename(temp_file.name)
            video_path = temp_file.name

        results = detector.process_video(video_path, sample_rate=2)
        summary = detector.analyze_video_results(results)

        print("✅ Summary:", summary)

        # Upload result to Firestore
        doc.reference.set({
            "status": "complete",
            "results": summary
        }, merge=True)

        os.unlink(video_path)

if __name__ == "__main__":
    analyze_pending_videos()

