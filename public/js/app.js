let HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);
console.log(HOST)

ws.addEventListener("open", () => {
  console.log("We are connected!")
});


const button = document.querySelector("#btn")

button.addEventListener("click", function() {
  fetchClips();
});


const userClips = [];
const gameClips = [];
let userCounter = 0;
let gameCounter = 0;
let isUserClipsFetched = false;
let isGameClipsFetched = false;


const fetchClips = async () => {
  try {
    // First fetch access token so we can use the API
    const res = await axios.post('https://id.twitch.tv/oauth2/token?client_id=str8k2ifmiexe3gqkd2ctq38pjhvoi&client_secret=sqhukdwucvdpjzdj997l3kq36y7whb&grant_type=client_credentials')
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
        "Client-Id": "str8k2ifmiexe3gqkd2ctq38pjhvoi"
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
  // Get 24 hours ago's date in RFC3339 format
  const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
  // Se we can excecute another function right after lastIndex is fetched
  const gameListLength = gameIdList.length;
  for(let i = 0; i < gameIdList.length; i++) {
    // Excecute this function for every gameId
    fetchTopGameClipsOfTheDay(token, gameIdList[i], yesterday, gameListLength)
  }
}

const fetchTopGameClipsOfTheDay = async (token, gameId, date, gameListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": "str8k2ifmiexe3gqkd2ctq38pjhvoi"
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?game_id=${gameId}&started_at=${date}`, config)
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
        "Client-Id": "str8k2ifmiexe3gqkd2ctq38pjhvoi"
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
  // Get 24 hours ago's date in RFC3339 format
  const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
    // Se we can excecute another function right after lastIndex is fetched
    const userListLength = userIdList.length;
  for(let i = 0; i < userIdList.length; i++) {
    // Excecute this function for every userId
    fetchTopClipsOfTheDay(token, userIdList[i], yesterday, userListLength)
  }
}

const fetchTopClipsOfTheDay = async (token, userId, date, userListLength) => {
  try {
    const config = {
      headers:{
        "Authorization": `Bearer ${token}`,
        "Client-Id": "str8k2ifmiexe3gqkd2ctq38pjhvoi"
      }
    }
    const res = await axios.get(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&started_at=${date}`, config)
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
  console.log("time to BAKE")

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
  // Return the first 50 clips
  const clipsReady = clipsSort.slice(0, 100);
  console.log(clipsReady.slice(-1)[0])
  sendClips(clipsReady);
}

const sendClips = (clipsReady) => {
  console.log(clipsReady)
  const payLoad = {
    method: "sendClips",
    clips: clipsReady
  };
  ws.send(JSON.stringify(payLoad));
}