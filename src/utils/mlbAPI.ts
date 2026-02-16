import axios from 'axios';

const mlbApi = axios.create({
  baseURL: "https://statsapi.mlb.com/api/v1",
  timeout: 50000,
});

const CUBS_ID = 112;

export type GameInfo = {
  date: string;
  game_time: string;
  parkingBegins: string;
  visiting_team: string;
  booked: boolean;
};

// Helper: subtract 1 hour from "01:20 PM"
function subtractOneHour(timeStr: string): string {
  const date = new Date(`1970-01-01 ${timeStr}`);

  if (isNaN(date.getTime())) {
    return "TBD";
  }

  date.setHours(date.getHours() - 1);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

export async function getRedSoxHomeGamesNextMonth() {
  const response = await mlbApi.get("/schedule", {
    params: {
      sportId: 1,
      teamId: CUBS_ID,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    },
  });

  const games: GameInfo[] = [];

  for (const dateBlock of response.data.dates) {
    for (const game of dateBlock.games) {
      if (game.teams.home.team.id === CUBS_ID) {
        const date = dateBlock.date;
        const visitingTeam = game.teams.away.team.name;

        let game_time = "TBD";

        if (game.gameDate) {
          const venueTimeZone = game.venue?.timeZone?.id || "America/Chicago";
          const gameDate = new Date(game.gameDate);

          if (!isNaN(gameDate.getTime())) {
            game_time = gameDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: venueTimeZone
            });
          }
        }

        // NEW: compute parkingBegins
        const parkingBegins = subtractOneHour(game_time);

        games.push({
          date,
          game_time,
          parkingBegins,
          visiting_team: visitingTeam,
          booked: false
        });
      }
    }
  }

  return games;
}
