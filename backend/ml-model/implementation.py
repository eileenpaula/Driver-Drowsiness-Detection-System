import tensorflow as tf
import numpy as np
import cv2, time, os


class DrowsinessDetctor:
    def __init__(self,model_path,confidence_threshold=0.5):
        """
        Initialize the DrowsinessDetector with the pretrained model."
        
        Arguments:
        model_path: Path to the saved TensorFlow model.
        threshold_alertness: Threshold for determining alertness (default is 0.5).
        threshold_eyes: Threshold for determining if eyes are open or closed.
        threshold_yawn: Threshold for determining if yawning.
        
        """

        try:
            self.model = tf.keras.models.load_model(model_path)
            print("Model loaded successfully.")
            self.model.summary()
        except Exception as e:
            print(f"Error loading model: {e}")
            raise RuntimeError(f"Failed to load model from {model_path}.")

        self.alertness_labels = ["Alert", "Low Vigilant", "Very Drowsy"]
        self.yawn_labels = ["Not Yawning", "Yawning"]
        self.eye_labels = ["Eyes Open", "Eyes Closed"]
    
        
    def preprocess_frame(self, frame):
        """
        Preprocess the input frame for model prediction.
        
        Arguments:
            frame: Input video frame.
        
        Returns:
            Preprocessed frame as a numpy array ready for model input.
        """
        
        # Resize the image to the input size of the model
        resized_frame = cv2.resize(frame, (224, 224))

        # Convert the image from BGR to RGB format
        rgb_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)
        
        # Normalize pixel values to [0, 1] range
        normalized_frame = rgb_frame / 255.0
        
        # Expand dimensions to match model input shape (1, height, width, channels)
        preprocessed_frame = np.expand_dims(normalized_frame, axis=0)

        batch = np.expand__dims(normalized_frame, axis=0)
        
        return batch
    
    def process_frame(self,frame):
        """
        Process a single image and return model predictions.
        
        Arguments:
        frame: Input video frame.
        
        Returns:
            alertness_level: Level of alertness (0-3).
            yawn_level: Level of yawning (0-1).
            eye_state: State of eyes (0-1).
        """
        
        preprocessed = self.preprocess_frame(frame)
        predictions = self.model.predict(preprocessed, verbose=0)
        
        if isinstance(predictions, list):
            if len(predictions) >= 3:
                alertness_scores = predictions[0][0] # [Alert, Low Vigilant, Very Drowsy]
                yawn_state = predictions[1][0] # [Not Yawning, Yawning]
                eyes_state = predictions[2][0] # [Eyes Open, Eyes Closed]
            else: 
                print(f"Warning: Expected 3 outputs, but got {len(predictions)}. Using default values.")
                drowsiness_scores = np.array([0.8, 0.1, 0.1]) #default to alert
                yawn_state = np.array([0.9, 0.1]) #default to not yawning
                eyes_state = np.array([0.9, 0.1]) #default to eyes open
        else:
            print("Warning: Expected list of outputs but got single output. Using default values.")
            alertness_scores = np.array([0.8, 0.1, 0.1]) #default to alert
            yawn_state = np.array([0.9, 0.1]) #default to not yawning
            eyes_state = np.array([0.9, 0.1]) #default to eyes open

        alertness_idx = np.argmax(drowsiness_scores)
        alertness_label = self.alertness_labels[alertness_idx]
        alertness_confidence = alertness_scores[alertness_idx]

        eyes_closed = bool(eyes_state[1] > self.threshold_eyes)
        eyes_confidence = eyes_state[1] if eyes_closed else eyes_state[0]
        eyes_label = self.eye_labels[1] if eyes_closed else self.eye_labels[0]

        yawning = bool(yawn_state[1] > self.threshold_yawn)
        yawn_confidence = yawn_state[1] if yawning else yawn_state[0]
        yawn_label = self.yawn_labels[1] if yawning else self.yawn_labels[0]

        results = {
            "timestamp": time.time(),
            "alertness":{
                "label": alertness_label,
                "index": alertness_idx,
                "confidence": float(alertness_confidence),
                "raw_scores": alertness_scores.tolist()
            },
            "eyes": {
                "label": eyes_label,
                "closed": eyes_closed,
                "confidence": float(eyes_confidence),
                "raw_scores": eyes_state.tolist()
            },
            "yawn": {
                "label": yawn_label,
                "yawning": yawning,
                "confidence": float(yawn_confidence),
                "raw_scores": yawn_state.tolist()
            },
            "overall_drowsiness": self.calculate_drowsiness(alertness_scores),
        }

        return results
    
    def calculate_drowsiness(self, alertness_scores):
        """
        Calculate the overall drowsiness level based on alertness, eye state, and yawning.
        
        Arguments:
            alertness_scores: The array of alertness probabilities.

        Returns:
            Float representing the overall drowsiness level. (0.0-1.0)
        """

        low_vigilant_score = alertness_scores[1]
        very_drowsy_score = alertness_scores[2]

        drowsiness_score = (low_vigilant_score + 2 * very_drowsy_score) / 3
        return min(1.0, max(0.0,float(drowsiness_score)))  # Ensure the score is between 0 and 1
    
    def annotate_frame(self, frame, results):
        """
        Annotate the image with predictions.
        
        Arguments:
            image: Input video frame.
            results: Dictionary containing prediction results.
        
        Returns:
            Annotated image.
        """
        annotated_frame = frame.copy()
        h, w = annotated_frame.shape[:2]

        overlay = annotated_frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 150), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)

        alertness_text = f"Alertness: {results['alertness']['label']} ({results['alertness']['confidence']:.2f})"
        cv2.putText(annotated_frame, alertness_text, (20,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        eyes_color = (0, 0, 255) if results['eyes']['closed'] else (0, 255, 0)
        eyes_text = f"Eyes: {results['eyes']['label']} ({results['eyes']['confidence']:.2f})"
        cv2.putText(annotated_frame, eyes_text, (20,70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, eyes_color, 2)

        yawn_color = (0, 0, 255) if results['yawn']['yawning'] else (0, 255, 0)
        yawn_text = f"Yawn: {results['yawn']['label']} ({results['yawn']['confidence']:.2f})"
        cv2.putText(annotated_frame, yawn_text, (20,110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, yawn_color, 2)

        drowsiness = results['drowsiness_score']
        if drowsiness < 0.3:
            status_color = (0, 255, 0)
            status_text = "SAFE"
        elif drowsiness < 0.6:
            status_color = (0, 255, 255)
            status_text = "WARNING"
        else:
            status_color = (0, 0, 255)
            status_text = "DANGER!"

        cv2.putText(annotated_frame, f"Drowsiness: {status_text} ({drowsiness:.2f})", 
                    (w - 250, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, status_color, 3)
        
        return annotated_frame
    
    def process_video(self, video_path, output_path=None, display=False, sample_rate=1, max_frames=None):
        """
        Process the video and save the annotated output.
        
        Arguments:
            video_path: Path to the input video file.
            output_path: Path to save the annotated video.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error: Could not open video at {video_path}")
            return []
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        #print(f"Video info: {width}x{height} @ {fps}fps, {total_frames}total frames")

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

            annotated_frame = self.annotate_frame(frame, result)

            if writer:
                writer.write(annotated_frame)

            if display:
                cv2.imshow("Drowsiness Detection", annotated_frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            processed_frames += 1

            if max_frames and processed_frames >= max_frames:
                break

        print(f"Processed {processed_frames} out of {total_frames} frames.")

        cap.release()
        if writer:
            writer.release()
        if display:
            cv2.destroyAllWindows()

        return results
    
    def analyze_video_results(self, results):
        """
        Analyze the results of the processed video.
        
        Arguments:
            results: List of dictionaries containing prediction results for each frame.
        
        Returns:
            Dictionary containing analysis results.
        """
        if not results:
            return {"error": "No results to analyze."}

        drowsiness_scores = [result['overall_drowsiness'] for result in results]
        alertness_labels = [result['alertness']['label'] for result in results]
        eyes_closed_frames = sum(1 for result in results if result['eyes']['closed'])
        yawning_frames = sum(1 for result in results if result['yawn']['yawning'])

        total_frames = len(results)
        eyes_closed_percentage = (eyes_closed_frames / total_frames) * 100
        yawning_percentage = (yawning_frames / total_frames) * 100

        alertness_counts = {}
        for label in self.alertness_labels:
            alertness_counts[label] = alertness_labels.count(label)

        alertness_percentages = {label: (count / total_frames) * 100 
                                 for label, count in alertness_counts.items()}
        
        threshold = 0.6
        min_episode_length = 5

        episodes = []
        current_episode = None

        for i, score in enumerate(drowsiness_scores):
            if score >= threshold:
                if current_episode is None:
                    current_episode = {"start": i, "scores": [score]}
                else:
                    current_episode["scores"].append(score)
            else:
                if current_episode is not None:
                    if len(current_episode["scores"]) >= min_episode_length:
                        current_episode["end"] = i - 1
                        current_episode['duration'] = current_episode["end"] - current_episode["start"] +1
                        current_episode['average_score'] = sum(current_episode["scores"]) / len(current_episode["scores"])
                        episodes.append(current_episode)
                    current_episode = None

        if current_episode is not None and len(current_episode["scores"]) >= min_episode_length:
            current_episode["end"] = len(drowsiness_scores) - 1
            current_episode['duration'] = current_episode["end"] - current_episode["start"] +1
            current_episode['average_score'] = sum(current_episode["scores"]) / len(current_episode["scores"])
            episodes.append(current_episode)

        analysis = {
            "total_frames": total_frames,
            "avg_drowsiness": sum(drowsiness_scores) / total_frames,
            "max_drowsiness": max(drowsiness_scores),
            "eyes_closed_percentage": eyes_closed_percentage,
            "yawning_percentage": yawning_percentage,
            "alertness_counts": alertness_counts,
            "alertness_percentages": alertness_percentages,
            "drowsiness_episodes": {
                "count": len(episodes),
                "details": episodes
            }
        }

        return analysis
