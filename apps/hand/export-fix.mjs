// The preserved editor (compiled, see handborne/source) hands GLTFExporter procedural DataTextures,
// and its exporter then calls canvas drawImage() with a raw {data,width,height} image, which browsers reject
// ("Failed to execute 'drawImage'"), so GLB export fails. App-only adapter: draw such raw RGBA data through
// a temporary canvas. Real images/canvases pass straight through unchanged.
const draw = CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
  if (image && image.data && image.width && image.height && !(image instanceof Node) && typeof image.close !== 'function') {
    const pixels = image.data, canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength), image.width, image.height), 0, 0);
    return draw.call(this, canvas, ...args);
  }
  return draw.call(this, image, ...args);
};
