const express = require("express");
const app = express();
const { exec } = require('child_process');
const server = require("http").createServer(app);
const WebSocket = require("ws")

//to get directory path
const path = require('path');
const fs = require('fs');

const wss = new WebSocket.Server({ server:server })
app.use(express.static("public/"));


let outputPath = `${__dirname}\\CLIPS`
// Gives error/returns script if .exe file is not included in the outputPath
let hasPathError = false;
let clipsPath = 0;

wss.on("connection", (ws) => {
  // ws.on("open", () => console.log("opened"));
  // ws.on("close", () => console.log("closed"))
  ws.on("message", (message) => {
    const result = JSON.parse(message);
    if(result.method === "sendClips") {
      for(let i = 0; i < result.clips.length; i++) {
        downloadClip(result.clips[i].url)
      }
    }
    if(result.method === "sendSettings") {
      outputPath = result.path
      clipsPath = 0;
      makeFolder()
      fs.readdir(`${outputPath}`, function (err, files) {
        if (err) return console.log('Unable to scan directory: ' + err);
        //listing all files using forEach
        for(let file of files) {
          if(file.includes(".exe")) {
            hasPathError = false;
          } else {
            hasPathError = true;
          }
        }
        sendPayLoad();
      });

      function sendPayLoad() {
        const payLoad = {
          method: "verifyPath",
          verify: hasPathError
        }
        ws.send(JSON.stringify(payLoad))
      }

    }
  })
  // Init client side content
  const sendData = {
    method: "givePath",
    path: `${__dirname}/CLIPS`
  }
  ws.send(JSON.stringify(sendData))
})
 
// Download the actual clips
function downloadClip(url) {
  exec(`youtube-dl.exe -f best ${url}`, {cwd: `${outputPath}/${clipsPath}`}, (err, stdout, stderr) => {
  if (err) return;
  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  });
}


function makeFolder() {
  clipsPath = 0;
  // Finds what the folder name should be called (in this case its integers that increments)
  fs.readdir(`${outputPath}`, function (err, files) {
    if (err) return console.log('Unable to scan directory: ' + err);

    //listing all files using forEach
    files.forEach(function (file) {
        // console.log(file);
        clipsPath++
    });
    setPath()
  });
}
// Create a new folder for the clips
function setPath() {
  exec(`mkdir ${clipsPath}`, {cwd: `${outputPath}`}, (err, stdout, stderr) => {
  if (err) return;
  // the *entire* stdout and stderr (buffered)
  console.log(`Standard Output: ${stdout}`);
  console.log(`Standard Error: ${stderr}`);
  });
} 


server.listen(3000, () => {
  console.log("LISTENING ON PORT 3000!");
});
