// ─── Canvas Setup ─────────────────────────
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.querySelector("#color-picker");
const clearCanvasBtn = document.querySelector(".clear-canvas");

let isDrawing = false;
let brushWidth = 60;
let selectedColor = "#000";

function setCanvasBackground() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selectedColor;
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = canvas.offsetHeight || 500;
  setCanvasBackground();
}

window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

// ─── Drawing ─────────────────────────────
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.lineCap = "round";
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => (isDrawing = false));

// ─── Color Picker ────────────────────────
colorPicker.addEventListener("change", () => {
  selectedColor = colorPicker.value;
});

// ─── Clear Canvas ────────────────────────
clearCanvasBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground();
});

// ─── Images ────────────────────────
const images = [
  { src: "salal-berries.png", alt: "salal-berries" },
  { src: "barberry.png", alt: "barberry" },
  { src: "guava.png", alt: "guava" },
  { src: "snowberry.png", alt: "snowberry" }
];

let currentIndex = 0;

const mainImage = document.getElementById("main-image");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

function showImage(index) {
  mainImage.src = images[index].src;
  mainImage.alt = images[index].alt;
}

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex);
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
});


// ─── Color Mixing ────────────────────────
const hexToRgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return { r: v >> 16 & 255, g: v >> 8 & 255, b: v & 255 };
};

const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

const mixHex = (h1, h2, ratio) => {
  const c1 = hexToRgb(h1), c2 = hexToRgb(h2);
  return rgbToHex({
    r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
    g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
    b: Math.round(c1.b * (1 - ratio) + c2.b * ratio),
  });
};

const col1 = document.getElementById("mix-col-1");
const col2 = document.getElementById("mix-col-2");
const ratioS = document.getElementById("mix-ratio");
const preview = document.getElementById("mix-preview");
const apply = document.getElementById("apply-mix");

function updateMix() {
  const mix = mixHex(col1.value, col2.value, ratioS.value / 100);
  preview.style.background = mix;
  preview.textContent = mix;
}

[col1, col2, ratioS].forEach((el) => el.addEventListener("input", updateMix));
updateMix();

apply.addEventListener("click", () => {
  selectedColor = preview.style.background;
  document.querySelector(".colors .selected")?.classList.remove("selected");
});

// ─── Color Match ─────────────────────────
//const img = document.querySelector(".ref-img img");
const checkBtn = document.getElementById("check-match");
const resultDiv = document.getElementById("match-result");

function getDominantColor(image) {
  const imageCanvas = document.createElement("canvas");
  const ctx2 = imageCanvas.getContext("2d");
  imageCanvas.width = image.naturalWidth;
  imageCanvas.height = image.naturalHeight;
  ctx2.drawImage(image, 0, 0);
  const data = ctx2.getImageData(0, 0, imageCanvas.width, imageCanvas.height).data;

  const colorCount = {};
  let maxCount = 0;
  let dominantColor = [255, 255, 255];

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const alpha = data[i + 3];

    if (alpha > 0 && !(red > 240 && green > 240 && blue > 240)) { // Skip white background
      const key = `${red},${green},${blue}`;

      colorCount[key] = (colorCount[key] || 0) + 1;

      if (colorCount[key] > maxCount) {
        maxCount = colorCount[key];
        dominantColor = [red, green, blue];
      }
    }
  }

  return dominantColor;
}

function colorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

function getMatchPercent(rgb1, rgb2) {
  const maxDist = Math.sqrt(255 ** 2 * 3);
  const dist = colorDistance(rgb1, rgb2);
  return Math.round(100 - (dist / maxDist) * 100);
}

function getCanvasAverageColor() {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const alpha = data[i + 3];

    // Skip white background pixels
    if (alpha > 0 && !(red > 240 && green > 240 && blue > 240)) {
      r += red;
      g += green;
      b += blue;
      count++;
    }
  }

  return count ? [r / count, g / count, b / count] : [255, 255, 255];
}

checkBtn.addEventListener("click", () => {
  // Get dominant color from the reference image
  const imgRGB = getDominantColor(mainImage);

  // Get average color from the canvas
  const canvasRGB = getCanvasAverageColor();

  // Calculate match percentage
  const match = getMatchPercent(imgRGB, canvasRGB);

  // Display result
  resultDiv.innerHTML = `<strong>Match:</strong> ${match}%`;
});