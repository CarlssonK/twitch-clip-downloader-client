const express = require("express");
const app = express();
const { exec } = require('child_process');
const server = require("http").createServer(app);
const WebSocket = require("ws")
const PORT = process.env.PORT || 3000;

//to get directory path
const path = require('path');
const fs = require('fs');

const wss = new WebSocket.Server({ server:server })


app.use(express.static("public/"));


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
  })
})

function downloadClip(url) {
  exec(`youtube-dl.exe -f best ${url}`, {cwd: `D:/CLIPS/${clipsPath}`}, (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  });
}

// Choose what folder name should be called
fs.readdir("D:/CLIPS", function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  } 
  //listing all files using forEach
  files.forEach(function (file) {
      // Do whatever you want to do with the file
      console.log(file);
      clipsPath++
      console.log(clipsPath)
  });
  setPath()
});

function setPath() {
  exec(`mkdir ${clipsPath} && copy youtube-dl.exe D:\\CLIPS\\${clipsPath}`, {cwd: `D:/CLIPS`}, (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  });
}



server.listen(PORT, () => {
  console.log("LISTENING ON PORT 3000!");
});