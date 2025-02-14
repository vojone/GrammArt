/**
 * Downloads content of canvas specified by its id
 * @param canvasId Id of canvas its content will be downloaded
 * @param name Name of downloaded file without extension
 */
function downloadCanvasContent(canvas, name) {
  function downloadImage(image) {
    let tmpLink = document.createElement("a");
    tmpLink.href = image.src;
    tmpLink.download = `${name}`;
    tmpLink.click();
  }

  let img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => { downloadImage(img); };
}

function downloadText(text, filename = "file.txt") {
  var tmpLink = document.createElement("a");
  tmpLink.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  tmpLink.download = filename;
  tmpLink.click();
}

function loadTextFileInput(loadTextFn, encoding = "UTF-8") {
  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.onchange = (e) => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file, encoding);
    reader.onload = readerEvent => {
      let content = readerEvent.target.result;
      loadTextFn(content);
    }
  }

  return fileInput;
}

function padZero(num) {
  return num <= 9 ? `0${num}` : `${num}`;
}

function channelsToRGB(channelsArr) {
  return `rgb(${channelsArr[0]} ${channelsArr[1]} ${channelsArr[2]})`
}

function clipSum(lop, rop, lbound, hbound) {
  return Math.min(Math.max(lop + rop, lbound), hbound)
}

function dec2hex(dec) {
  return  dec.toString(16);
}
