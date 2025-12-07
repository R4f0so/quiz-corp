import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParticipantLogin, useQuizSettings } from '@/hooks/useQuiz';
import { Users, Trophy, Loader2 } from 'lucide-react';
import type { TeamType } from '@/lib/types';

const Index = () => {
  const navigate = useNavigate();
  const { currentParticipant, login, loading } = useParticipantLogin();
  const { settings, loading: settingsLoading } = useQuizSettings();
  const [matricula, setMatricula] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [step, setStep] = useState<'matricula' | 'team'>('matricula');
  const [error, setError] = useState('');

  // If already logged in, redirect to appropriate page
  useEffect(() => {
    if (currentParticipant && settings) {
      if (settings.status === 'waiting') {
        navigate('/lobby');
      } else if (settings.status === 'active') {
        navigate('/quiz');
      } else if (settings.status === 'finished') {
        navigate('/results');
      }
    }
  }, [currentParticipant, settings, navigate]);

  const handleMatriculaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula.trim()) {
      setError('Digite sua matrícula');
      return;
    }

    setError('');
    const result = await login(matricula.trim());
    
    if (result.participant) {
      // Existing participant, redirect
      if (settings?.status === 'waiting') {
        navigate('/lobby');
      } else if (settings?.status === 'active') {
        navigate('/quiz');
      } else if (settings?.status === 'finished') {
        navigate('/results');
      }
    } else if (result.isNew) {
      // New participant, need team selection
      setStep('team');
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleTeamSelect = async (team: TeamType) => {
    setSelectedTeam(team);
    const result = await login(matricula.trim(), team);
    
    if (result.participant) {
      navigate('/lobby');
    } else if (result.error) {
      setError(result.error);
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-cream" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      {/* Header */}
      <header className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-warning-light" />
          <h1 className="text-2xl font-display font-bold text-cream">Quiz Corporativo</h1>
        </div>
        <p className="text-cream/80 text-sm">Desafie seu conhecimento!</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {step === 'matricula' ? (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">Entrar no Quiz</h2>
                <p className="text-muted-foreground text-sm mt-1">Digite sua matrícula para participar</p>
              </div>

              <form onSubmit={handleMatriculaSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula" className="text-foreground font-semibold">
                    Matrícula
                  </Label>
                  <Input
                    id="matricula"
                    type="text"
                    placeholder="Ex: 12345"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="h-12 text-lg text-center font-semibold"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-xl font-display font-bold text-foreground">Escolha seu Time</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Matrícula: <span className="font-semibold">{matricula}</span>
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  variant="teamAline"
                  size="full"
                  className="h-20 text-lg"
                  onClick={() => handleTeamSelect('aline')}
                  disabled={loading}
                  data-selected={selectedTeam === 'aline'}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold">🌿 Time Aline</span>
                    <span className="text-cream/80 text-sm">Verde e Sustentável</span>
                  </div>
                </Button>

                <Button
                  variant="teamAdelino"
                  size="full"
                  className="h-20 text-lg"
                  onClick={() => handleTeamSelect('adelino')}
                  disabled={loading}
                  data-selected={selectedTeam === 'adelino'}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold">🔥 Time Adelino</span>
                    <span className="text-cream/80 text-sm">Energia e Determinação</span>
                  </div>
                </Button>

                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}

                <button
                  type="button"
                  onClick={() => setStep('matricula')}
                  className="w-full text-center text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-cream/60 text-xs">© 2024 Quiz Corporativo</p>
      </footer>
    </div>
  );
};

export default Index;