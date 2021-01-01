let HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);

ws.addEventListener("open", () => {
  console.log("We are connected!")
});

const button = document.querySelector("#btn")
const inputPath = document.querySelector("#input-path")
const clipsAmount = document.querySelector("#clips-amount")
const clipsStarted = document.querySelector("#clips-started")
const loading = document.querySelector(".loading")

let setAmount = "";
let clipsDate = null;

// ######## CONFIGURATION ########

// Create an application on https://dev.twitch.tv/console to get your client id and client secret
const clientId = "your_client_id_here"
const clientSecret = "your_client_secret_here" // note your client secret is private thus should not be shown to other people

// ######## CONFIGURATION ########


button.addEventListener("click", function() {
  setAmount = parseInt(clipsAmount.value)
  switch(clipsStarted.value) {
    case "1Year":
      clipsDate = new Date(new Date().getTime() - (8760 * 60 * 60 * 1000)).toISOString();
      break;
    case "30Days":
      clipsDate = new Date(new Date().getTime() - (720 * 60 * 60 * 1000)).toISOString();
      break;
    case "7Days":
      clipsDate = new Date(new Date().getTime() - (168 * 60 * 60 * 1000)).toISOString();
      break;
    case "24Hours":
      clipsDate = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
      break;
    default:
      clipsDate = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
  }

    const payLoad = {
      method: "sendSettings",
      path: inputPath.value
    }
    ws.send(JSON.stringify(payLoad));
});

ws.onmessage = (message) => {
  const response = JSON.parse(message.data);
  if (response.method === "givePath") {
    const path = response.path;
    inputPath.value = path;
  }
  if (response.method === "verifyPath") {
    const hasPathError = response.verify
    if(hasPathError === false) fetchClips();
  }
}



let userClips = [];
let gameClips = [];
let userCounter = 0;
let gameCounter = 0;
let isUserClipsFetched = false;
let isGameClipsFetched = false;


const fetchClips = async () => {
  userClips = [];
  gameClips = [];
  userCounter = 0;
  gameCounter = 0;
  isUserClipsFetched = false;
  isGameClipsFetched = false;
  console.log(`FETCHING CLIPS...`)
  try {
    // First fetch access token so we can use the API
    const res = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`)
    const token = res.data.access_token;
    // Chain of multiple functions, in the end, returns big list of top categoriy/game clips
    fetchTopGames(token);
    // Chain of multiple functions, in the end, returns big list of top user clips
    fetchHandPickedUsers(token);
  } catch(err) {
    console.error("ERROR!", err)
  }
}
 


// ########## FETCH GAMES ##########

const fetchTopGames = async (token) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": `${clientId}`
      }
    }
    const res = await axios.get('https://api.twitch.tv/helix/games/top?first=20', config)
    const gameIdList = [];
    for(let game of res.data.data) {
      gameIdList.push(game.id)
    }
    getAllGameClips(token, gameIdList)
  } catch(err) {
    console.error("ERROR!", err)
  }
}

const getAllGameClips = (token, gameIdList) => {
  // Se we can excecute another function right after lastIndex is fetched
  const gameListLength = gameIdList.length;
  for(let i = 0; i < gameIdList.length; i++) {
    // Excecute this function for every gameId
    fetchTopGameClipsOfTheDay(token, gameIdList[i], gameListLength)
  }
}

const fetchTopGameClipsOfTheDay = async (token, gameId, gameListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": `${clientId}`
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?game_id=${gameId}&started_at=${clipsDate}`, config)
    for(let i = 0; i < 20; i++) {
      if(res.data.data[i] === undefined) continue;
      // Push top 5 clips and its views from a user
      gameClips.push({url: res.data.data[i].url, views: res.data.data[i].view_count})
    }
    // Below code checks if the userClips is fetched, if its true, execute Combine funciton
    gameCounter++;
    if(gameCounter === gameListLength) {
      isGameClipsFetched = true;
      if(isUserClipsFetched === true) Combine(gameClips, userClips);
    }

  } catch(err) {
    console.error("ERROR!", err)
  }
}



// ########## FETCH USERS ##########

const fetchHandPickedUsers = async (token) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": `${clientId}`
      }
    }
    const res = await axios.get('https://api.twitch.tv/helix/users?login=xQcOW&login=shroud&login=Myth&login=Pokimane&login=sodapoppin&login=summit1g&login=NICKMERCS&login=TimTheTatman&login=loltyler1&login=Symfuhny&login=Lirik&login=Anomaly&login=Asmongold&login=Mizkif&login=HasanAbi&login=ludwig&login=moistcr1tikal&login=MitchJones&login=Nmplol&login=JakenBakeLIVE&login=Knut&login=Maya&login=pokelawls&login=itssliker&login=EsfandTV&login=erobb221&login=drdisrespect', config)
    const userIdList = [];
    for(let user of res.data.data) {
      userIdList.push(user.id)
    }
    getAllUserClips(token, userIdList)
  } catch(err) {
    console.error("ERROR!", err)
  }
}

const getAllUserClips = (token, userIdList) => {
    // Se we can excecute another function right after lastIndex is fetched
    const userListLength = userIdList.length;
  for(let i = 0; i < userIdList.length; i++) {
    // Excecute this function for every userId
    fetchTopClipsOfTheDay(token, userIdList[i], userListLength)
  }
}

const fetchTopClipsOfTheDay = async (token, userId, userListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": `${clientId}`
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&started_at=${clipsDate}`, config)
    for(let i = 0; i < 10; i++) {
      if(res.data.data[i] === undefined) continue;
      // Push top 5 clips and its views from a user
      userClips.push({url: res.data.data[i].url, views: res.data.data[i].view_count})
    }
    // Below code checks if the gameClips is fetched, if its true, execute Combine funciton
    userCounter++;
    if(userCounter === userListLength) {
      isUserClipsFetched = true;
      if(isGameClipsFetched === true) Combine(gameClips, userClips);
    }

  } catch(err) {
    console.error("ERROR!", err)
  }
}

// ########## COMBINE USERS&GAMES AND SEND TO SERVER ##########


const Combine = (gameClips, userClips) => {

  // Merges gameClips and userClips together
  const arr = [...gameClips, ...userClips]

  // Filter outs duplicates
  const seen = new Set();
  const clipsNoDuplicate = arr.filter(el => {
  const duplicate = seen.has(el.url);
  seen.add(el.url);
  return !duplicate;
  });
  // Sort clips from most viewed to least viewed
  const clipsSort = clipsNoDuplicate.sort((a, b) => (a.views < b.views) ? 1 : -1)
  // Return the first setAmount clips
  const clipsReady = clipsSort.slice(0, setAmount);
  sendClips(clipsReady);
  console.log(`DOWNLOADING CLIPS...`)
}

const sendClips = (clipsReady) => {
  const payLoad = {
    method: "sendClips",
    clips: clipsReady
  };
  ws.send(JSON.stringify(payLoad));
}