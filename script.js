const video = document.getElementById('webcam');
const highlightCanvas = document.getElementById('highlightCanvas');
const webcamButton = document.getElementById('webcamButton');

const bodyPixProperties = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4
};

const segmentationProperties = {
  flipHorizontal: false,
  internalResolution: 'high',
  segmentationThreshold: 0.9
};

const colourMap = [
  { r: 244, g: 67, b: 54, a: 255 },  // Left face
  { r: 183, g: 28, b: 28, a: 255 },  // Right face
  { r: 233, g: 30, b: 99, a: 255 },  // Left upper arm front
  { r: 136, g: 14, b: 79, a: 255 },  // Left upper arm back
  // Additional body parts as needed...
];

let model = undefined;
let modelHasLoaded = false;

function processSegmentation(canvas, segmentation) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (segmentation.data[n] !== -1) {
      const color = colourMap[segmentation.data[n]];
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = 255;
    } else {
      data[i + 3] = 0; // Make transparent
    }
    n++;
  }

  ctx.putImageData(imageData, 0, 0);
}

bodyPix.load(bodyPixProperties).then((loadedModel) => {
  model = loadedModel;
  modelHasLoaded = true;
  webcamButton.style.display = 'block';
});

function enableCam() {
  if (!modelHasLoaded) {
    console.error('BodyPix model not loaded yet.');
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.addEventListener('loadeddata', () => {
        highlightCanvas.width = video.videoWidth;
        highlightCanvas.height = video.videoHeight;
        predictWebcam();
      });
    })
    .catch((err) => console.error('Error accessing webcam:', err));
}

function predictWebcam() {
  model.segmentPerson(video, segmentationProperties)
    .then((segmentation) => {
      processSegmentation(highlightCanvas, segmentation);
      requestAnimationFrame(predictWebcam);
    });
}

webcamButton.addEventListener('click', enableCam);
