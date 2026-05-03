"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCubsHomeGames = getCubsHomeGames;
const axios_1 = __importDefault(require("axios"));
const mlbApi = axios_1.default.create({
    baseURL: "https://statsapi.mlb.com/api/v1",
    timeout: 50000,
});
const CUBS_ID = 112;
// Helper: subtract 1 hour from "01:20 PM"
function subtractOneHour(timeStr) {
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
async function getCubsHomeGames() {
    var _a, _b, _c, _d, _e;
    const response = await mlbApi.get("/schedule", {
        params: {
            sportId: 1,
            teamId: CUBS_ID,
            startDate: "2026-04-01",
            endDate: "2026-07-30",
        },
    });
    const games = [];
    for (const dateBlock of (_a = response.data.dates) !== null && _a !== void 0 ? _a : []) {
        for (const game of (_b = dateBlock.games) !== null && _b !== void 0 ? _b : []) {
            if (game.teams.home.team.id !== CUBS_ID)
                continue;
            if (((_c = game.status) === null || _c === void 0 ? void 0 : _c.detailedState) !== "Scheduled")
                continue;
            const date = dateBlock.date;
            const visitingTeam = game.teams.away.team.name;
            let gameTime = "TBD";
            let parkingBegins = "TBD";
            if (game.gameDate) {
                const venueTimeZone = ((_e = (_d = game.venue) === null || _d === void 0 ? void 0 : _d.timeZone) === null || _e === void 0 ? void 0 : _e.id) || "America/Chicago";
                const gameDate = new Date(game.gameDate);
                if (!isNaN(gameDate.getTime())) {
                    gameTime = gameDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: venueTimeZone,
                    });
                    const parkingDate = new Date(gameDate.getTime() - 60 * 60 * 1000);
                    parkingBegins = parkingDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: venueTimeZone,
                    });
                }
            }
            games.push({
                date,
                game_time: gameTime,
                parkingBegins,
                visiting_team: visitingTeam,
                booked: false,
            });
        }
    }
    return games;
}
