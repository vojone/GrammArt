/**
 * In January 2025 there is still not supported Uint8Arry.fromBase64 across
 * all browsers, so it is necessary to convert it by the following function to
 * ensure the compatibility
 *
 * Based on https://stackoverflow.com/a/21797381
 */
function Uint8ArrayFromBase64(base64) {
  let binaryString = atob(base64);
  let bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
