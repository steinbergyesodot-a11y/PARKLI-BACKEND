import axios from 'axios';

const mlbApi = axios.create({
  baseURL: "https://statsapi.mlb.com/api/v1",
  timeout: 50000,
});


const RED_SOX_ID = 111;

export type GameInfo = {
  date: string;
  visiting_team:
  string; booked: boolean
}

export  async function getRedSoxHomeGamesNextMonth() {

  const response = await mlbApi.get("/schedule", {
    params: {
      sportId: 1,
      teamId: RED_SOX_ID,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    },
  });

const games: GameInfo[] = [];
for (const dateBlock of response.data.dates) {
  for (const game of dateBlock.games) {
    if (game.teams.home.team.id === RED_SOX_ID){
      const date = dateBlock.date;
      const visitingTeam = game.teams.away.team.name
      const booked = false;
      
      games.push({
        date,
        visiting_team : visitingTeam,
        booked
      })
      

    } 
  }
}

return games
}







