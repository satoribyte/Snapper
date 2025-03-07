#!/bin/bash

echo "Menjalankan app.py..."
python3 app.py &

sleep 5

echo "Menjalankan perintah SSH..."
ssh -R 80:localhost:5000 serveo.net
