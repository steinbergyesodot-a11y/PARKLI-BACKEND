"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedSoxHomeGamesNextMonth = getRedSoxHomeGamesNextMonth;
const axios_1 = __importDefault(require("axios"));
const mlbApi = axios_1.default.create({
    baseURL: "https://statsapi.mlb.com/api/v1",
    timeout: 50000,
});
const CUBS_ID = 112;
async function getRedSoxHomeGamesNextMonth() {
    const response = await mlbApi.get("/schedule", {
        params: {
            sportId: 1,
            teamId: CUBS_ID,
            startDate: "2026-04-01",
            endDate: "2026-04-30",
        },
    });
    const games = [];
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
                console.log("PUSHING GAME:", {
                    date,
                    game_time,
                    visiting_team: visitingTeam,
                    booked: false
                });
                games.push({
                    date,
                    game_time,
                    visiting_team: visitingTeam,
                    booked: false
                });
            }
        }
    }
    return games;
}
