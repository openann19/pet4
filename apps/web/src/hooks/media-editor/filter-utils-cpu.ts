/**
 * CPU-based filter utilities for image processing
 * Used as fallback when GPU acceleration is unavailable
 */

export function applyBrightness(imageData: ImageData, value: number): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const adjustment = value * 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
      result.data[i] = Math.max(0, Math.min(255, r + adjustment));
      result.data[i + 1] = Math.max(0, Math.min(255, g + adjustment));
      result.data[i + 2] = Math.max(0, Math.min(255, b + adjustment));
      result.data[i + 3] = a;
    }
  }

  return result;
}

export function applyContrast(imageData: ImageData, value: number): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const factor = (1 + value) ** 2;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
      result.data[i] = Math.max(0, Math.min(255, ((r / 255 - 0.5) * factor + 0.5) * 255));
      result.data[i + 1] = Math.max(0, Math.min(255, ((g / 255 - 0.5) * factor + 0.5) * 255));
      result.data[i + 2] = Math.max(0, Math.min(255, ((b / 255 - 0.5) * factor + 0.5) * 255));
      result.data[i + 3] = a;
    }
  }

  return result;
}

export function applySaturation(imageData: ImageData, value: number): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const adjustment = 1 + value;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
      // Calculate luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply saturation adjustment
      result.data[i] = Math.max(0, Math.min(255, gray + (r - gray) * adjustment));
      result.data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * adjustment));
      result.data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * adjustment));
      result.data[i + 3] = a;
    }
  }

  return result;
}

export function applyGrain(imageData: ImageData, intensity: number): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
      const noise = (Math.random() - 0.5) * intensity * 50;
      result.data[i] = Math.max(0, Math.min(255, r + noise));
      result.data[i + 1] = Math.max(0, Math.min(255, g + noise));
      result.data[i + 2] = Math.max(0, Math.min(255, b + noise));
      result.data[i + 3] = a;
    }
  }

  return result;
}

export function applyVignette(imageData: ImageData, intensity: number): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      const vignetteFactor = 1 - (dist / maxDist) * intensity;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        result.data[i] = r * vignetteFactor;
        result.data[i + 1] = g * vignetteFactor;
        result.data[i + 2] = b * vignetteFactor;
        result.data[i + 3] = a;
      }
    }
  }

  return result;
}

