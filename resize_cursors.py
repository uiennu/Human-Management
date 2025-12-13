import os
from PIL import Image
import sys

# Define target size
TARGET_SIZE = (32, 32)

# Define paths
public_dir = r"d:\sinhviennam4\PTUDHTTTHD\Project\Human-Management\frontend\public"
files = ["tay thả.png", "tay nắm.png", "tay trỏ.png"]

def resize_image(filename):
    path = os.path.join(public_dir, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    try:
        with Image.open(path) as img:
            print(f"Original size of {filename}: {img.size}")
            # Resize using LANCZOS for high quality
            img_resized = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
            img_resized.save(path)
            print(f"Resized {filename} to {TARGET_SIZE}")
    except Exception as e:
        print(f"Error resizing {filename}: {e}")

if __name__ == "__main__":
    # Check if PIL is installed
    try:
        import PIL
    except ImportError:
        print("Pillow library not found. Please install it with 'pip install Pillow'")
        sys.exit(1)

    for f in files:
        resize_image(f)
