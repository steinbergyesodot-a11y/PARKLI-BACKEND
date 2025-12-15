import express from 'express'
import axios from 'axios';


interface Team {
  id: number;
  full_name: string;
}

interface Game {
  date: string;
  home_team: Team;
  visitor_team: Team;
}

interface GamesResponse {
  data: Game[];
}



const PORT = process.env.PORT || 3000

const app = express();

app.use(express.json());

async function getGames(){
    try{
      const response = await axios.get( "https://api.balldontlie.io/mlb/v1/games?team_ids[]=20&seasons[]=2024", {
        headers: 
        {
             "Authorization": "Bearer 65550685-28f8-4ee8-98bf-132ccb092011", 
        },
    }
    );
    

    
    const games = response.data.data;

    for (const game of games) {
      const dateObj = new Date(game.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let opponent: string;

      if (game.home_team.id === 20) {
        opponent = game.visitor_team.full_name;
      } else if (game.visitor_team.id === 20) {
        opponent = game.home_team.full_name;
      } else {
        opponent = "Unknown Team";
      }

      console.log(`${formattedDate}: vs. ${opponent}`);
    }
  
    }catch(error){
        console.error("Error fetching games:", error);
     } 
}


getGames()



app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`)
})
