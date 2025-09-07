import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Flag, Trophy } from "lucide-react";

interface PlayerData {
  name: string;
  age: string;
  nationality: string;
  position: string;
  city: string;
  experience: string;
  photo?: string;
}

interface PlayerProfileProps {
  playerData: PlayerData;
  className?: string;
}

const PlayerProfile = ({ playerData, className = "" }: PlayerProfileProps) => {
  return (
    <Card className={`p-6 bg-white shadow-strong border-0 animate-fade-in ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Player Photo */}
        <div className="flex-shrink-0">
          {playerData.photo ? (
            <img 
              src={playerData.photo} 
              alt={`Foto de ${playerData.name}`}
              className="w-20 h-20 rounded-full object-cover border-4 border-gradient-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground mb-2 truncate">
            {playerData.name || "Jogador"}
          </h2>
          
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{playerData.age} anos</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <Flag className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{playerData.nationality || "Brasil"}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{playerData.city}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              {playerData.position}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {playerData.experience}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlayerProfile;