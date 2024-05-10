import numpy as np
import math
import cv2
from skimage import color
from ultralytics import YOLO
import base64
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)


def resize_and_pad_image(img, target_size=(300, 300), pad_color=(255, 255, 255)):
    scale = min(target_size[0] / img.shape[1], target_size[1] / img.shape[0])
    resized_img = cv2.resize(img, (0, 0), fx=scale, fy=scale)
    top = (target_size[1] - resized_img.shape[0]) // 2
    bottom = target_size[1] - resized_img.shape[0] - top
    left = (target_size[0] - resized_img.shape[1]) // 2
    right = target_size[0] - resized_img.shape[1] - left
    padded_img = cv2.copyMakeBorder(
        resized_img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=pad_color)
    return padded_img


def calculate_gradient_sobel(image):
    if len(image.shape) > 2:
        image_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        image_gray = image
    grad_x = cv2.Sobel(image_gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(image_gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
    gradient_magnitude_norm = cv2.normalize(
        gradient_magnitude, None, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_64F)
    return gradient_magnitude_norm


def get_optimized_cluster_centers(image, K):
    height, width = image.shape[:2]
    S = int(np.sqrt(height * width / K))
    gradient = calculate_gradient_sobel(image)
    cluster_centers = []
    for i in range(0, height - S, S):
        for j in range(0, width - S, S):
            center_i, center_j = i + S // 2, j + S // 2
            neighborhood_size = S // 4
            min_pos = (center_i, center_j)
            min_gradient = gradient[center_i, center_j]
            for ni in range(max(0, center_i - neighborhood_size), min(height, center_i + neighborhood_size + 1)):
                for nj in range(max(0, center_j - neighborhood_size), min(width, center_j + neighborhood_size + 1)):
                    if gradient[ni, nj] < min_gradient:
                        min_gradient = gradient[ni, nj]
                        min_pos = (ni, nj)
            cluster_centers.append(min_pos)
    return cluster_centers, gradient


def slic_superpixels(image, K, m, num_iterations=3):
    lab_image = color.rgb2lab(image)
    height, width = image.shape[:2]
    N = height * width
    A = N / K
    S = int(np.sqrt(A))
    cluster_centers, gradient = get_optimized_cluster_centers(image, K)
    labels = -1 * np.ones(image.shape[:2], np.int32)
    distances = np.inf * np.ones(image.shape[:2], np.float64)
    spatial_scale = m/S
    for _ in range(num_iterations):
        for ci, center in enumerate(cluster_centers):
            cx, cy = center
            for i in range(max(0, cx - S), min(height, cx + S)):
                for j in range(max(0, cy - S), min(width, cy + S)):
                    d_lab = math.dist(lab_image[cx, cy], lab_image[i, j])
                    d_spatial = math.dist([cx, cy], [i, j])
                    d = d_lab + spatial_scale * d_spatial
                    if d < distances[i, j]:
                        distances[i, j] = d
                        labels[i, j] = ci
        for ci in range(len(cluster_centers)):
            members = np.where(labels == ci)
            if members[0].size > 0:
                new_center_x = np.mean(members[0])
                new_center_y = np.mean(members[1])
                cluster_centers[ci] = (int(new_center_x), int(new_center_y))
    final_image = np.zeros_like(image)
    for ci in range(len(cluster_centers)):
        members = np.where(labels == ci)
        if members[0].size > 0:
            for channel in range(3):
                final_image[members[0], members[1], channel] = np.mean(
                    image[members[0], members[1], channel])
    return final_image, labels, cluster_centers, gradient


# def main(image_path):
#     original_image = cv2.imread(image_path)
#     original_image = original_image[:, :, ::-1]
#     image = resize_and_pad_image(original_image)
#     image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#     final_img, _, _, _ = slic_superpixels(image, K=200, m=2)
#     model = YOLO('./assets/best.pt')
#     results = model.predict(final_img)
#     prediction_class = results[0].probs.top1
#     names = results[0].names
#     conf = round(results[0].probs.top1conf.item() * 100, 2)
#     prediction = names[prediction_class]
#     prediction_text = f'{prediction.upper()} ({conf}%)'
#     resized_image_encoded = base64.b64encode(
#         cv2.imencode('.png', image)[1]).decode()
#     final_image_encoded = base64.b64encode(
#         cv2.imencode('.png', final_img)[1]).decode()

#     return resized_image_encoded, final_image_encoded, prediction_text

# def main(base64_image):
#     # Decode base64 to bytes
#     image_data = base64.b64decode(base64_image)
#     # Convert to numpy array
#     image_array = np.frombuffer(image_data, dtype=np.uint8)
#     # Convert numpy array to image
#     original_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
#     # Convert BGR to RGB
#     original_image = original_image[:, :, ::-1]
#     # Resize and pad image
#     image = resize_and_pad_image(original_image)
#     # Convert image to RGB for processing
#     image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#     # Process image to get superpixels
#     final_img, _, _, _ = slic_superpixels(image, K=200, m=2)
#     # Initialize and use YOLO model for prediction
#     model = YOLO('./assets/best.pt')
#     results = model.predict(final_img, verbose=False)
#     prediction_class = results[0].probs.top1
#     names = results[0].names
#     conf = round(results[0].probs.top1conf.item() * 100, 2)
#     prediction = names[prediction_class]
#     prediction_text = f'{prediction.upper()} ({conf}%)'
#     # Encode the resized and final images as base64
#     resized_image_encoded = base64.b64encode(
#         cv2.imencode('.png', image)[1]).decode()
#     final_image_encoded = base64.b64encode(
#         cv2.imencode('.png', final_img)[1]).decode()

#     print(f"{resized_image_encoded}|{final_image_encoded}|{prediction_text}")
#     # return resized_image_encoded, final_image_encoded, prediction_text


# if __name__ == '__main__':
#     # print(sys.argv)
#     main(sys.argv[1])


@app.route('/process-logo', methods=['POST'])
def process_logo():
    data = request.json
    base64data = data['base64data']

    # Convert base64 to image
    image_data = base64.b64decode(base64data)
    image_array = np.frombuffer(image_data, dtype=np.uint8)
    original_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    original_image = original_image[:, :, ::-1]  # Convert BGR to RGB

    # Process the image
    image = resize_and_pad_image(original_image)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    final_img, _, _, _ = slic_superpixels(image, K=200, m=2)

    # Initialize YOLO model and predict
    model = YOLO('./assets/best.pt')
    results = model.predict(final_img, verbose=False)
    prediction_class = results[0].probs.top1
    names = results[0].names
    conf = round(results[0].probs.top1conf.item() * 100, 2)
    prediction = names[prediction_class]
    prediction_text = f'{prediction.upper()} ({conf}%)'

    # Encode images to return as base64
    resized_image_encoded = base64.b64encode(
        cv2.imencode('.png', image)[1]).decode()
    final_image_encoded = base64.b64encode(
        cv2.imencode('.png', final_img)[1]).decode()

    return jsonify({
        'resized_image_encoded': resized_image_encoded,
        'final_image_encoded': final_image_encoded,
        'prediction_text': prediction_text
    })


if __name__ == '__main__':
    port = os.getenv('PY_PORT', 5011)
    print(f"Starting the Flask server on port {port}...")
    app.run(host='0.0.0.0', port=int(port))
