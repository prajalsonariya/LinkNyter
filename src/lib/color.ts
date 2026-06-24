export function extractDominantColor(imgElement: HTMLImageElement): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve([139, 92, 246]); return; }
    canvas.width = 50; canvas.height = 50;
    ctx.drawImage(imgElement, 0, 0, 50, 50);
    const d = ctx.getImageData(0, 0, 50, 50).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < d.length; i += 16) {
      const brightness = (d[i] + d[i+1] + d[i+2]) / 3;
      if (brightness > 30 && brightness < 220) { r += d[i]; g += d[i+1]; b += d[i+2]; count++; }
    }
    if (count === 0) { resolve([139, 92, 246]); return; }
    resolve([Math.round(r/count), Math.round(g/count), Math.round(b/count)]);
  });
}
