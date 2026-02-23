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

    // App State closeAlertModal
    const state = {
  isRegistered: false,
  faceIdCaptured: false,
  user: {
    fullName: '',
    matricNumber: '',
    faceBlob: null, // Change this from Descriptors
  }
};
async function registerFace() {
    const name = document.getElementById('fullName').value.trim();
    const matric_no = document.getElementById('matricNumber').value.trim();
    
    if (!state.user.faceBlob) {
        return showAlertModal('error', 'Missing Data', 'Please capture your face again.');
    }

    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('name', name);
    formData.append('matric_no', matric_no);
    formData.append('face_image', state.user.faceBlob); // This matches our Django 'request.FILES'

    try {
        const res = await fetch('http://51.20.75.100:8000/api/register-face/', {
            method: 'POST',
            body: formData // Browser sets Content-Type to multipart/form-data automatically
        });

        const data = await res.json();
        if (data.status === 'success') {
            showAlertModal('success', 'Registered', `Account created for ${name}`);
        } else {
            showAlertModal('error', 'Registration Failed', data.message || 'Error saving to DB');
        }
    } catch (err) {
        showAlertModal('error', 'Server Error', 'Could not connect to the backend.');
    }
}
   const videoFeed = document.getElementById('video');
    const overlay = document.getElementById('overlay')

    let videoStream = null;
    // camera start 
    async function startCamera() {
      try {
        stopCamera(); // stop any previous camera
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
     
        videoFeed.srcObject = videoStream;
        await videoFeed.play();
      } catch (err) {
        console.error('Could not start camera:', err);
        alert('Camera not accessible. Make sure no other app is using it and permissions are allowed.');
      }
    }
// camera stop
    function stopCamera() {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;

     
        if (videoFeed) videoFeed.srcObject = null;
      }
    }

   let faceLandmarker;
let runningMode = "IMAGE";
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

    // Loading overlay closeAlertModal
    function showLoading(text) {
      document.getElementById('loading-text').textContent = text;
      document.getElementById('loading-overlay').classList.add('active');
    }

    function hideLoading() {
      document.getElementById('loading-overlay').classList.remove('active');
    }

    // Logout modal
   
      window.shwLogoutModal = function() {
      document.getElementById('logout-modal').classList.add('active');
    }


    // Registration Functions
   
      window.openFaceCaptureModal = function() {
      document.getElementById('face-capture-modal').classList.add('active');
      startCamera();
    };

    window.closeFaceCaptureModal = function () {
      
      document.getElementById('face-capture-modal').classList.remove('active');
    }

   
 window.captureFaceId = async function() {
    if (!faceLandmarker) return;

    // 1. Detect face
    const detections = await faceLandmarker.detect(videoFeed);
    
    // DEBUG: Look at your console to see the structure if it fails again
    console.log("Detections:", detections);

    // MediaPipe FaceLandmarker usually returns results in .faceLandmarks
    if (!detections || !detections.faceLandmarks || detections.faceLandmarks.length === 0) {
        return showAlertModal('error', 'No Face Detected', 'Please position your face clearly in the camera.');
    }

    showLoading('Capturing Face ID...');

    const canvas = document.createElement('canvas');
    canvas.width = 112;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');

    // 2. Manual Bounding Box Calculation 
    // Since faceBoundingBoxes can be undefined, we calculate the box from landmarks
    const landmarks = detections.faceLandmarks[0];
    let minX = 1, minY = 1, maxX = 0, maxY = 0;

    landmarks.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
    });

    // Convert normalized (0-1) to pixels
    let x = minX * videoFeed.videoWidth;
    let y = minY * videoFeed.videoHeight;
    let w = (maxX - minX) * videoFeed.videoWidth;
    let h = (maxY - minY) * videoFeed.videoHeight;

    // 3. Add Padding for InsightFace (20% extra space)
    const padding = w * 0.2;
    x -= padding;
    y -= padding;
    w += padding * 2;
    h += padding * 2;

    // 4. Draw & Capture
    ctx.drawImage(videoFeed, x, y, w, h, 0, 0, 112, 112);

    canvas.toBlob((blob) => {
        state.user.faceBlob = blob;
        state.faceIdCaptured = true;
        
        hideLoading();
        updateFaceCaptureUI();
        closeFaceCaptureModal();
        stopCamera();
        
        showAlertModal('success', 'Face ID Captured', 'Face data is ready for registration.');
    }, 'image/jpeg', 0.95);
}
    //welcome to 

    function updateFaceCaptureUI() {
      const box = document.getElementById('face-capture-box');
      const title = document.getElementById('face-capture-title');
      const desc = document.getElementById('face-capture-desc');
      const iconDefault = document.getElementById('face-icon-default');
      const iconSuccess = document.getElementById('face-icon-success');
      const error = document.getElementById('faceId-error');

      if (state.faceIdCaptured) {
        box.classList.add('captured');
        title.textContent = 'Face ID Captured';
        desc.textContent = 'Tap to recapture if needed';
        iconDefault.style.display = 'none';
        iconSuccess.style.display = 'block';
        error.classList.remove('visible');
      } else {
        box.classList.remove('captured');
        title.textContent = 'Capture Face ID';
        desc.textContent = 'Tap to register your face for verification';
        iconDefault.style.display = 'block';
        iconSuccess.style.display = 'none';
      }
    }

    function validateRegistration() {
      let isValid = true;
      const fullName = document.getElementById('fullName');
      const matricNumber = document.getElementById('matricNumber');
      const fullNameError = document.getElementById('fullName-error');
      const matricError = document.getElementById('matricNumber-error');
      const faceError = document.getElementById('faceId-error');

      // Reset errors
      fullName.classList.remove('error');
      matricNumber.classList.remove('error');
      fullNameError.classList.remove('visible');
      matricError.classList.remove('visible');
      faceError.classList.remove('visible');

      // Validate full name
      if (!fullName.value.trim() || fullName.value.trim().length < 2) {
        fullName.classList.add('error');
        fullNameError.classList.add('visible');
        isValid = false;
      }

      // Validate matric number
      if (!matricNumber.value.trim() || matricNumber.value.trim().length < 3) {
        matricNumber.classList.add('error');
        matricError.classList.add('visible');
        isValid = false;
      }

      // Validate face ID
      if (!state.faceIdCaptured) {
        faceError.classList.add('visible');
        isValid = false;
      }

      return isValid;
    }

      window.submitRegistration = function() {

      if (!validateRegistration()) {
        return;
      }

      const fullName = document.getElementById('fullName').value.trim();
      const matricNumber = document.getElementById('matricNumber').value.trim();

      showLoading('Creating your account...');

      setTimeout(() => {
        hideLoading();
        state.isRegistered = true;
        state.user.fullName = fullName;
        state.user.matricNumber = matricNumber;
        console.log(state)
        //Store data in databse
        registerFace();
        // Update welcome name  showloading

        showAlertModal('success', 'Registration Complete', 'Welcome to Timely! You can now mark your attendance.');

        // Navigate to home after alert is closed
      }, 1500);
    }



    // Alert Modal Functions
    function showAlertModal(type, title, message) {
      const modal = document.getElementById('alert-modal');
      const iconContainer = document.getElementById('alert-icon');
      const successIcon = document.getElementById('alert-icon-success');
      const errorIcon = document.getElementById('alert-icon-error');
      const warningIcon = document.getElementById('alert-icon-warning');
      const alertTitle = document.getElementById('alert-title');
      const alertMessage = document.getElementById('alert-message');

      // Reset icons
      successIcon.style.display = 'none';
      errorIcon.style.display = 'none';
      warningIcon.style.display = 'none';
      iconContainer.classList.remove('success', 'error', 'warning');

      // Set icon and style based on type
      iconContainer.classList.add(type);
      if (type === 'success') {
        successIcon.style.display = 'block';
      } else if (type === 'error') {
        errorIcon.style.display = 'block';
      } else if (type === 'warning') {
        warningIcon.style.display = 'block';
      }

      alertTitle.textContent = title;
      alertMessage.textContent = message;
      modal.classList.add('active');
    }


      window.closeAlertModal = function() {
      document.getElementById('alert-modal').classList.remove('active');
    }

    loadFaceModels();
