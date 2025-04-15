# Step 1: Import Required Libraries
import pandas as pd
import os
import shutil
from sklearn.model_selection import train_test_split


# Step 2: Load Processed Dataset
df = pd.read_csv("./processed_data/processed_data.csv")
print("Dataset Loaded Successfully!")
print(df.head())


# Step 3: Define Output Structure
SPLIT_BASE = "./dataset_split"
TASKS = ["ddd", "yawdd", "eye_state"]
SPLITS = ["train", "test"]

for task in TASKS:
    for split in SPLITS:
        path = os.path.join(SPLIT_BASE, split, task)
        os.makedirs(path, exist_ok=True)


# Step 4: Split Function (Train/Test Only)
TRAIN_RATIO = 0.8  # 80% train, 20% test

def split_and_copy(df_task, task):
    print(f"\n🔹 Splitting task: {task}")

    # Filter classes with at least 3 examples
    class_counts = df_task['label'].value_counts()
    valid_classes = class_counts[class_counts >= 3].index
    df_task = df_task[df_task['label'].isin(valid_classes)]

    # Train/Test split
    train_df, test_df = train_test_split(
        df_task,
        test_size=(1 - TRAIN_RATIO),
        stratify=df_task["label"],
        random_state=42
    )

    def copy_files(dataframe, split_name):
        copied, missing = 0, 0
        for _, row in dataframe.iterrows():
            src_path = os.path.normpath(row["image_path"])
            label = str(row["label"])
            dst_dir = os.path.join(SPLIT_BASE, split_name, task, label)
            os.makedirs(dst_dir, exist_ok=True)

            if not os.path.exists(src_path):
                print(f"Missing file: {src_path}")
                missing += 1
                continue

            dst_path = os.path.join(dst_dir, os.path.basename(src_path))
            shutil.copy2(src_path, dst_path)
            copied += 1

        print(f"   {split_name.capitalize()} - Copied: {copied}, Missing: {missing}")

    copy_files(train_df, "train")
    copy_files(test_df, "test")

    print(f" - {task} - Total: {len(df_task)}, Train: {len(train_df)}, Test: {len(test_df)}")


# Step 5: Apply to All Tasks
for task in TASKS:
    df_task = df[df["type"] == task]
    if len(df_task) == 0:
        print(f"No data found for task: {task}")
        continue
    split_and_copy(df_task, task)

print("\n Dataset successfully split into train and test!")
