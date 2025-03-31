import tensorflow as tf
import numpy as np
import cv2
import time
import os
from tensorflow.keras.models import load_model
from PIL import Image

class DrowsinessDetector:
    def __init__(self,model_path,threshold_alertness=0.5,threshold_eyes=0.5, threshold_yawn=0.5):
        """
        Initialize the DrowsinessDetector with the pretrained model."
        
        Arguments:
        model_path: Path to the saved TensorFlow model.
        threshold_alertness: Threshold for determining alertness (default is 0.5).
        threshold_eyes: Threshold for determining if eyes are open or closed.
        threshold_yawn: Threshold for determining if yawning.
        
        """
        self.model = load_model(model_path)
        self.threshold_alertness = threshold_alertness
        self.threshold_eyes = threshold_eyes
        self.threshold_yawn = threshold_yawn
        self.alertness_labels = ["Alert", "Low Vigilant", "Very Drowsy"]
        self.yawn_labels = ["Not Yawning", "Yawning"]
        self.eye_labels = ["Eyes Open", "Eyes Closed"]
    
    def preprocess_iamge(self, iamge):
        """
        Preprocess a video frame to prepare it for the model.
        
        Arguments:
        frame: Input video frame.
        
        Returns:
            Preprocessed frame ready for model prediction.
        """
        
        if isinstance(image,str):
            image = cv2.imread(image)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        elif isinstance(image, Image.Image):
            image = np.array(image)
            
        resized = cv2.resize(image, (124,124))
        normalized = resized/255.0
        batch = np.expand_dims(normalized, axis=0)
        
        return batch
    
    def process_video_frame(self,frame):
        """
        Process a video frame to detect drowsiness.
        
        Arguments:
        frame: Input video frame.
        
        Returns:
            alertness_level: Level of alertness (0-3).
            yawn_level: Level of yawning (0-1).
            eye_state: State of eyes (0-1).
        """
        
        preprocessed_frame = self.preprocess_frame(frame)
        predictions = self.model.predict(preprocessed_frame, verbose=0)
        
        alertness_scores = predictions[0][0] #[Alert, Low Vigilant, Very Drowsy]
        eyes_state = predictions[1][0] #[Eyes Open, Eyes Closed]
        yawn_state = predictions[2][0] #[Not Yawning, Yawning]

        alertness_idx = np.argmax(alertness_scores)
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
            "overall_drowsiness": self.calculate_drowsiness(alertness_scores)
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

        drowsy_score = alertness_scores[2]
        very_drowsy_score = alertness_scores[3]

        drowsiness_score = (drowsy_score + 2 * very_drowsy_score) / 3
        return min(1.0, max(0.0,float(drowsiness_score)))  # Ensure the score is between 0 and 1
    
    def process_video(self, video_path, output_path=None, display = True):
        """
        
        """