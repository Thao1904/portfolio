/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2020.
 *
 * Got questions? Reach out to me on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 ********************************************************************/

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');

// An object to configure parameters to set for the bodypix model.
const bodyPixProperties = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4
};

// Parameters for detection.
const segmentationProperties = {
  flipHorizontal: false,
  internalResolution: 'high',
  segmentationThreshold: 0.9
};

// Define colors for different body parts.
const colourMap = [
  { r: 244, g: 67, b: 54, a: 255 },  // Left face
  { r: 183, g: 28, b: 28, a: 255 },  // Right face
  { r: 233, g: 30, b: 99, a: 255 },  // Left upper arm front
  { r: 136, g: 14, b: 79, a: 255 },  // Left upper arm back
  { r: 233, g: 30, b: 99, a: 255 },  // Right upper arm front
  { r: 136, g: 14, b: 79, a: 255 },  // Right upper arm back
  { r: 233, g: 30, b: 99, a: 255 },  // Left lower arm front
  { r: 136, g: 14, b: 79, a: 255 },  // Left lower arm back
  { r: 233, g: 30, b: 99, a: 255 },  // Right lower arm front
  { r: 136, g: 14, b: 79, a: 255 },  // Right lower arm back
  { r: 156, g: 39, b: 176, a: 255 }, // Left hand
  { r: 156, g: 39, b: 176, a: 255 }, // Right hand
  { r: 63, g: 81, b: 181, a: 255 },  // Torso front
  { r: 26, g: 35, b: 126, a: 255 },  // Torso back
  { r: 33, g: 150, b: 243, a: 255 }, // Left upper leg front
  { r: 13, g: 71, b: 161, a: 255 },  // Left upper leg back
  { r: 33, g: 150, b: 243, a: 255 }, // Right upper leg front
  { r: 13, g: 71, b: 161, a: 255 },  // Right upper leg back
  { r: 0, g: 188, b: 212, a: 255 },  // Left lower leg front
  { r: 0, g: 96, b: 100, a: 255 },   // Left lower leg back
  { r: 0, g: 188, b: 212, a: 255 },  // Right lower leg front
  { r: 0, g: 96, b: 100, a: 255 },   // Right lower leg back
  { r: 255, g: 193, b: 7, a: 255 },  // Left feet
  { r: 255, g: 193, b: 7, a: 255 }   // Right feet
];

// Process segmentation for both canvases.
function processSegmentation(canvas, segmentation, isHighlightOnly = false) {
  const ctx = canvas.getContext('2d');

  if (isHighlightOnly) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (segmentation.data[n] !== -1) {
      const color = colourMap[segmentation.data[n]];
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = 255; // Set full alpha.
    } else if (!isHighlightOnly) {
      // Transparent for original canvas
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
    n++;
  }

  ctx.putImageData(imageData, 0, 0);
}

let model = undefined;
let modelHasLoaded = false;

// Load the BodyPix model.
bodyPix.load(bodyPixProperties).then((loadedModel) => {
  model = loadedModel;
  modelHasLoaded = true;
  demosSection.classList.remove('invisible');

  // Automatically enable the webcam after the model has loaded.
  enableCam();
});

const videoRenderCanvas = document.createElement('canvas');
const videoRenderCanvasCtx = videoRenderCanvas.getContext('2d');

// Webcam prediction function.
let previousSegmentationComplete = true;

function predictWebcam() {
  if (previousSegmentationComplete) {
    videoRenderCanvasCtx.drawImage(video, 0, 0);
    previousSegmentationComplete = false;

    model.segmentPersonParts(videoRenderCanvas, segmentationProperties).then((segmentation) => {
      const webcamCanvas = document.getElementById('webcamCanvas');
      const highlightCanvas = document.getElementById('highlightCanvas');
      processSegmentation(webcamCanvas, segmentation);
      processSegmentation(highlightCanvas, segmentation, true);
      previousSegmentationComplete = true;
    });
  }
  window.requestAnimationFrame(predictWebcam);
}

// Enable webcam.
function enableCam() {
  if (!modelHasLoaded) {
    console.warn('Model not loaded yet.');
    return;
  }

  const constraints = { video: true };
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.addEventListener('loadedmetadata', () => {
      webcamCanvas.width = video.videoWidth;
      webcamCanvas.height = video.videoHeight;
      videoRenderCanvas.width = video.videoWidth;
      videoRenderCanvas.height = video.videoHeight;
      highlightCanvas.width = video.videoWidth;
      highlightCanvas.height = video.videoHeight;
    });

    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  }).catch((error) => {
    console.error('Error accessing the webcam: ', error);
  });
}

// Check if webcam is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (!hasGetUserMedia()) {
  console.warn('getUserMedia() is not supported by your browser.');
}

document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('imagePopup');
  const popupImage = document.getElementById('popupImage');
  const close = document.querySelector('.popup .close');

  // Attach click event to trigger image
  document.querySelectorAll('.popup-trigger').forEach((img) => {
    img.addEventListener('click', () => {
      popup.style.display = 'block';
      popupImage.src = img.src; // Use the clicked image's source for the popup
    });
  });

  // Close the popup when the close button is clicked
  close.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  // Close the popup when clicking outside the image
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });
});

