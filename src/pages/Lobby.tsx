import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipantLogin, useQuizSettings, useParticipants } from '@/hooks/useQuiz';
import { Users, Trophy, Clock, Loader2 } from 'lucide-react';

const Lobby = () => {
  const navigate = useNavigate();
  const { currentParticipant } = useParticipantLogin();
  const { settings, loading: settingsLoading } = useQuizSettings();
  const { participants, teamCounts } = useParticipants();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentParticipant && !settingsLoading) {
      navigate('/');
    }
  }, [currentParticipant, settingsLoading, navigate]);

  // Redirect when quiz starts
  useEffect(() => {
    if (settings?.status === 'active') {
      navigate('/quiz');
    } else if (settings?.status === 'finished') {
      navigate('/results');
    }
  }, [settings, navigate]);

  if (settingsLoading || !currentParticipant) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-cream" />
      </div>
    );
  }

  const totalParticipants = participants.length;

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      {/* Header */}
      <header className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-warning-light" />
          <h1 className="text-xl font-display font-bold text-cream">Quiz Corporativo</h1>
        </div>
        <p className="text-cream/80 text-xs">Sala de Espera</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Waiting Animation */}
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-cream/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Clock className="w-12 h-12 text-cream animate-bounce-soft" />
          </div>
          <h2 className="text-2xl font-display font-bold text-cream mb-2">
            Aguardando o início...
          </h2>
          <p className="text-cream/70 text-sm">
            O quiz começará quando o administrador iniciar
          </p>
        </div>

        {/* Participant Info */}
        <div className="glass-card rounded-2xl p-4 w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-foreground font-semibold">Seus dados</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentParticipant.team === 'aline' 
                ? 'bg-emerald text-cream' 
                : 'bg-warning text-cream'
            }`}>
              Time {currentParticipant.team === 'aline' ? 'Aline' : 'Adelino'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Matrícula: <span className="font-semibold text-foreground">{currentParticipant.matricula}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="w-full max-w-md space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Total Participants */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Total de Participantes</span>
            </div>
            <span className="text-2xl font-display font-bold text-primary">{totalParticipants}</span>
          </div>

          {/* Team Counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald rounded-xl p-4 text-center">
              <span className="text-cream/80 text-xs block mb-1">🌿 Time Aline</span>
              <span className="text-3xl font-display font-bold text-cream">{teamCounts.aline}</span>
            </div>
            <div className="bg-warning rounded-xl p-4 text-center">
              <span className="text-cream/80 text-xs block mb-1">🔥 Time Adelino</span>
              <span className="text-3xl font-display font-bold text-cream">{teamCounts.adelino}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-cream/60 text-xs">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Conectado
        </div>
      </footer>
    </div>
  );
};

export default Lobby;