import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipantLogin, useQuizSettings, useParticipants } from '@/hooks/useQuiz';
import { Trophy, Medal, Users, Loader2 } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const { currentParticipant } = useParticipantLogin();
  const { settings, loading: settingsLoading } = useQuizSettings();
  const { teamScores, teamCounts } = useParticipants();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentParticipant && !settingsLoading) {
      navigate('/');
    }
  }, [currentParticipant, settingsLoading, navigate]);

  // Handle quiz reset - kick user out
  useEffect(() => {
    if (settings?.status === 'waiting') {
      localStorage.removeItem('quiz_matricula');
      navigate('/');
    }
  }, [settings?.status, navigate]);

  if (settingsLoading || !currentParticipant) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-cream" />
      </div>
    );
  }

  const winner = teamScores.aline > teamScores.adelino ? 'aline' : 
                 teamScores.adelino > teamScores.aline ? 'adelino' : 'empate';
  
  const maxScore = Math.max(teamScores.aline, teamScores.adelino, 1);
  const alineBarWidth = (teamScores.aline / maxScore) * 100;
  const adelinoBarWidth = (teamScores.adelino / maxScore) * 100;

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      {/* Header */}
      <header className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-warning-light" />
          <h1 className="text-xl font-display font-bold text-cream">Resultado Final</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Winner Announcement */}
        <div className="text-center animate-scale-in">
          {winner === 'empate' ? (
            <>
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-3xl font-display font-bold text-cream mb-2">Empate!</h2>
              <p className="text-cream/80">Ambos os times foram incríveis!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-display font-bold text-cream mb-2">
                Time {winner === 'aline' ? 'Aline' : 'Adelino'} Venceu!
              </h2>
              <p className="text-cream/80">Parabéns aos vencedores!</p>
            </>
          )}
        </div>

        {/* Score Cards */}
        <div className="w-full max-w-md space-y-4 animate-slide-up">
          {/* Team Aline */}
          <div className={`glass-card rounded-2xl p-5 ${winner === 'aline' ? 'ring-2 ring-warning-light' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald flex items-center justify-center">
                  {winner === 'aline' && <Medal className="w-6 h-6 text-warning-light" />}
                  {winner !== 'aline' && <span className="text-xl">🌿</span>}
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Time Aline</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {teamCounts.aline} participantes
                  </p>
                </div>
              </div>
              <span className="text-3xl font-display font-bold text-emerald">{teamScores.aline}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald rounded-full transition-all duration-1000"
                style={{ width: `${alineBarWidth}%` }}
              />
            </div>
          </div>

          {/* Team Adelino */}
          <div className={`glass-card rounded-2xl p-5 ${winner === 'adelino' ? 'ring-2 ring-warning-light' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
                  {winner === 'adelino' && <Medal className="w-6 h-6 text-cream" />}
                  {winner !== 'adelino' && <span className="text-xl">🔥</span>}
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Time Adelino</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {teamCounts.adelino} participantes
                  </p>
                </div>
              </div>
              <span className="text-3xl font-display font-bold text-warning">{teamScores.adelino}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning rounded-full transition-all duration-1000"
                style={{ width: `${adelinoBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Personal Score */}
        <div className="glass-card rounded-2xl p-5 w-full max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Sua Pontuação</p>
            <p className="text-4xl font-display font-bold text-foreground mb-2">
              {currentParticipant.score} pts
            </p>
            <p className={`text-sm font-semibold ${
              currentParticipant.team === 'aline' ? 'text-emerald' : 'text-warning'
            }`}>
              Time {currentParticipant.team === 'aline' ? 'Aline' : 'Adelino'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-cream/60 text-sm">Obrigado por participar! 🎉</p>
      </footer>
    </div>
  );
};

export default Results;