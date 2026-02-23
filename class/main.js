
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";


// Dark mode detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

// App State
const state = {
  currentClass: null,
  classes: [

  ],
  attendanceHistory: []
};
const api_endpoint = 'http://51.20.75.100:8000';

async function fetchClassrooms() {
  try {
    const res = await fetch(`${api_endpoint}/api/classrooms/`);  // Django API endpoint
    const data = await res.json();

    // Transform API data to your state structure
    state.classes = data.map(c => ({
      id: c.id,
      name: c.name,
      room: c.room,
      location: c.building,
      latitude: c.latitude,
      longitude: c.longitude,
      radius: c.radius_m,
      time: formatTime(c.time_start, c.time_end), // optional helper
      status: 'upcoming', // can add logic to check current time
      attended: false
    }));

    renderClassList();
    updateStats();
    console.log('Classrooms fetched:', state.classes);
  } catch (err) {
    console.error('Failed to fetch classrooms:', err);
  }
}

// Optional helper to format start/end times
function formatTime(start, end) {
  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  return `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Initialize app  startAttendance
function init() {
  fetchClassrooms();
  renderClassList();
  updateStats();

  loadFaceModels();
}

let faceLandmarker;
let runningMode = "VIDEO";
let lastVideoTime = -1;

// Load Face Models
async function loadFaceModels() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numFaces: 1
  });
  console.log("MediaPipe Ready");
}



// Get user location from ipinfo
async function getUserLocationFromIP() {

  try {
    const res = await fetch("https://ipinfo.io/json");
    const data = await res.json();

    const [lat, lng] = data.loc.split(",");
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };
  } catch (error) {
    return {
      lat: 6.4541,
      lng: 3.3947,
    };

  }

}

// Haversine distance (meters)

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  /**
   * This function Calculates distance of between classes
   */
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// store the stream globally
const video = document.getElementById('video');
let videoStream = null;
//Start Camera function
async function startCamera() {
  try {
    stopCamera(); // stop any previous camera
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = videoStream;
    await video.play();
  } catch (err) {
    console.error('Could not start camera:', err);
    alert('Camera not accessible. Make sure no other app is using it and permissions are allowed.');
  }
}
// Stop Camera function
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;


    if (video) video.srcObject = null;
  }
}
// Start attendance process verifyLocation

window.startAttendance = function (classId) {
  state.currentClass = state.classes.find(c => c.id === classId);
  if (!state.currentClass) return;

  document.getElementById('location-name').textContent = state.currentClass.location;
  document.getElementById('location-address').textContent = state.currentClass.room;
  navigateTo('location-screen');
}

// Render class list
function renderClassList() {
  const container = document.getElementById('class-list');
  container.innerHTML = state.classes.map(cls => `
        <div class="class-card" data-class-id="${cls.id}">
          <div class="class-info">
            <h4 class="class-name">${cls.name}</h4>
            <div class="class-meta">
              <span class="class-meta-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ${cls.time}
              </span>
              <span class="class-meta-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                ${cls.room}
              </span>
            </div>
          </div>
          ${cls.attended
      ? `<span class="class-status status-active">Attended</span>`
      : `<button class="btn btn-primary btn-attend" onclick="startAttendance(${cls.id})">Attend</button>`
    }
        </div>
      `).join('');
}

// Update statistics
function updateStats() {
  const total = state.classes.length;
  const attended = state.classes.filter(c => c.attended).length;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

  document.getElementById('total-classes').textContent = total;
  document.getElementById('attended-count').textContent = attended;
  document.getElementById('attendance-rate').textContent = rate + '%';
}

// Navigation

  window.navigateTo = function(screenId){
  // hide all screens
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  // show the target screen
  document.getElementById(screenId).classList.add("active");

  // special actions per screen
  if (screenId === "home-screen") {
    renderClassList();
    updateStats();
    stopCamera(); // stop camera after verification
  } else if (screenId === "attendance-screen") {
    renderAttendanceHistory();
    stopCamera(); // stop camera after verification
  } else if (screenId === "face-screen") {
    if (!videoStream) { // only start if not already running
      startCamera();
      face_rec();
    }
  }
}





// Verify location

window.verifyLocation = async function () {
  if (!state.currentClass) return;

  showLoading("Verifying location...");

  try {
    const userLocation = await getUserLocationFromIP();

    const classLat = state.currentClass.latitude;
    const classLng = state.currentClass.longitude;

    const distance = getDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      classLat,
      classLng
    );

    const ALLOWED_RADIUS = 100; // meters
    console.log('current class latitude', classLat, '-', userLocation.lat);
    console.log('current class lng', classLng, '-', userLocation.lng);
    hideLoading();

    if (distance <= ALLOWED_RADIUS) {

      navigateTo("face-screen");
    } else {
      alert(
        `You are too far from the class location.\nDistance: ${Math.round(distance)}m`
      );

    }
  } catch (err) {
    hideLoading();
    alert("Unable to verify location. Check internet connection.");
    console.error(err);
  }
}




// Mark attendance

window.markAttendance = function (name) {
  stopCamera(); // stop camera after verification
  if (!state.currentClass) return;

  state.currentClass.attended = true;
  state.attendanceHistory.push({
    ...state.currentClass,
    timestamp: new Date().toLocaleTimeString()
  });

  document.getElementById('success-class-name').textContent = name;
  navigateTo('success-screen');
}

// Render attendance history
function renderAttendanceHistory() {
  const container = document.getElementById('attendance-list');

  if (state.attendanceHistory.length === 0) {
    container.innerHTML = `
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>No attendance records yet</p>
          </div>
        `;
    return;
  }

  container.innerHTML = state.attendanceHistory.map(record => `
        <div class="attendance-item">
          <div class="class-info">
            <h4 class="class-name">${record.name}</h4>
            <div class="class-meta">
              <span class="class-meta-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ${record.timestamp}
              </span>
              <span class="class-meta-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                ${record.room}
              </span>
            </div>
          </div>
          <div class="attendance-check">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      `).join('');
}

// Loading overlay

window.showLoading = function (text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.add('active');
}


window.hideLoading = function () {
  document.getElementById('loading-overlay').classList.remove('active');
}

// Logout modal
window.showLogoutModal = function () {

  document.getElementById('logout-modal').classList.add('active');
}


window.hideLogoutModal = function () {
  document.getElementById('logout-modal').classList.remove('active');
}


window.logout = function () {
  hideLogoutModal();
  showLoading('Logging out...');
  setTimeout(() => {
    hideLoading();
    // Reset state
    state.classes.forEach(c => c.attended = false);
    state.attendanceHistory = [];
    renderClassList();
    updateStats();
  }, 1000);
}







const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

let cameraStarted = false;
function calculateEAR(landmarks) {
  const top = landmarks[159];
  const bottom = landmarks[145];
  return Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2));
}

const startCam = async () => {
  if (cameraStarted) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 }
  });

  video.srcObject = stream;
  await video.play();

  cameraStarted = true;
  requestAnimationFrame(face_rec);
};


let isProcessing = false; // Prevent multiple simultaneous uploads

const face_rec = async () => {
  const camera_hint =document.getElementById('camera-hint');
    if (video.videoWidth === 0) {
        requestAnimationFrame(face_rec);
        return;
    }

    const results = faceLandmarker.detectForVideo(video, performance.now());
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.faceLandmarks?.length) {
        const landmarks = results.faceLandmarks[0];
        const ear = calculateEAR(landmarks);
        

        if (ear < 0.012 && !isProcessing) {
            console.log("Blink detected ✅");
            isProcessing = true;
            

            // --- THE NEW PART: CROP AND SEND IMAGE ---
            // 1. Get the bounding box from MediaPipe results
            const box = results.faceBoundingBoxes ? results.faceBoundingBoxes[0] : null;
            
            // 2. Capture the face chip
            const faceBlob = await captureFaceChip(video, landmarks);
            
            // 3. Send to server
            await sendAttendanceData(faceBlob);
            
            setTimeout(() => { isProcessing = false; }, 3000);
        } else if (!isProcessing) {
            camera_hint.innerText = 'Please Blink';
        }

      // 🔁 Mirror canvas
      canvasCtx.save();
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);

      const drawingUtils = new DrawingUtils(canvasCtx);

      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );

      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );

      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );

      canvasCtx.restore();
    }
    requestAnimationFrame(face_rec);
};

// New Helper: Creates the tiny 112x112 image InsightFace needs  class-list
async function captureFaceChip(videoElement, landmarks) {
    const chipCanvas = document.createElement('canvas');
    chipCanvas.width = 112;
    chipCanvas.height = 112;
    const ctx = chipCanvas.getContext('2d');

    // Find the min/max of landmarks to create a bounding box manually
    const xs = landmarks.map(p => p.x * videoElement.videoWidth);
    const ys = landmarks.map(p => p.y * videoElement.videoHeight);
    const xMin = Math.min(...xs);
    const yMin = Math.min(...ys);
    const width = Math.max(...xs) - xMin;
    const height = Math.max(...ys) - yMin;

    // Add 20% padding so the face isn't too tight
    const padW = width * 0.2;
    const padH = height * 0.2;

    ctx.drawImage(videoElement, xMin - padW, yMin - padH, width + (padW*2), height + (padH*2), 0, 0, 112, 112);
    
    return new Promise(res => chipCanvas.toBlob(res, 'image/jpeg', 0.95));
}

async function sendAttendanceData(imageBlob) {
    const formData = new FormData();
    formData.append('face_image', imageBlob);
    // You might also want to send the current class ID
    formData.append('class_id', state.currentClass?.id);

    try {
        const response = await fetch(`${api_endpoint}/api/get-faces/`, {
            method: 'POST',
            body: formData // Note: Don't set Content-Type header manually with FormData
        });
        const result = await response.json();
        console.log("Server response:", result);
        if(result.status === "success") markAttendance(result.name);
        else alert("Face not recognized");
    } catch (err) {
        console.error("Upload failed", err);
    } finally {
        hideLoading();
    }
}

// Initialize
init();



