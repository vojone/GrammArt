const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");

if(ctx !== null) {

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 150, 75);

    downloadCanvasContent("main-canvas", "high", 500, 500);
}
