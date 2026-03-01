import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Flag, Trophy, Layers } from "lucide-react";

interface PlayerData {
  name: string;
  age: string;
  height?: string;
  weight?: string;
  nationality: string;
  position: string;
  city: string;
  experience: string;
  photo?: string;
  category?: string;
}

interface PlayerProfileProps {
  playerData: PlayerData;
  className?: string;
}

const PlayerProfile = ({ playerData, className = "" }: PlayerProfileProps) => {
  return (
    <Card className={`p-5 bg-card border-border animate-fade-in ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {playerData.photo ? (
            <img src={playerData.photo} alt={`Foto de ${playerData.name}`}
              className="w-16 h-16 rounded-xl object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground mb-2 truncate">{playerData.name || "Jogador"}</h2>
          <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{playerData.age} anos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{playerData.nationality || "Brasil"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{playerData.city}</span>
            </div>
            {(playerData.height || playerData.weight) && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {playerData.height && `${playerData.height}cm`}
                  {playerData.height && playerData.weight && " • "}
                  {playerData.weight && `${playerData.weight}kg`}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{playerData.position}</Badge>
            {playerData.category && (
              <Badge className="bg-accent/10 text-accent border-0 text-xs">
                <Layers className="w-3 h-3 mr-1" />{playerData.category}
              </Badge>
            )}
            <Badge className="bg-muted text-muted-foreground border-0 text-xs">{playerData.experience}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlayerProfile;
