import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuizSettings, useParticipants } from '@/hooks/useQuiz';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Settings
} from 'lucide-react';
import type { ParticipantStatus } from '@/lib/types';
import TopicManager from '@/components/admin/TopicManager';
import QuestionManager from '@/components/admin/QuestionManager';

const Admin = () => {
  const { settings, loading: settingsLoading, updateStatus } = useQuizSettings();
  const { participants, teamScores, teamCounts, loading: participantsLoading } = useParticipants();
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartQuiz = async () => {
    setActionLoading(true);
    await updateStatus('active');
    setActionLoading(false);
  };

  const handleEndQuiz = async () => {
    setActionLoading(true);
    await updateStatus('finished');
    setActionLoading(false);
  };

  const handleResetQuiz = async () => {
    if (!confirm('Tem certeza que deseja resetar o quiz? Isso apagará todas as respostas, pontuações e participantes.')) {
      return;
    }
    
    setActionLoading(true);
    
    // Delete all answers first (due to foreign key)
    await supabase.from('answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Delete all participants
    await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Reset quiz settings
    await updateStatus('waiting');
    
    setActionLoading(false);
  };

  const getStatusBadge = (status: ParticipantStatus) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Aguardando</span>;
      case 'answering':
        return <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Respondendo</span>;
      case 'finished':
        return <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Finalizado</span>;
    }
  };

  if (settingsLoading || participantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const winner = teamScores.aline > teamScores.adelino ? 'aline' : 
                 teamScores.adelino > teamScores.aline ? 'adelino' : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-forest text-cream p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-warning-light" />
              <div>
                <h1 className="text-2xl font-display font-bold">Painel Administrativo</h1>
                <p className="text-cream/70 text-sm">Quiz Corporativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                settings?.status === 'waiting' ? 'bg-muted text-muted-foreground' :
                settings?.status === 'active' ? 'bg-success text-cream' :
                'bg-warning text-cream'
              }`}>
                {settings?.status === 'waiting' ? '⏳ Aguardando' :
                 settings?.status === 'active' ? '🎮 Em andamento' :
                 '🏁 Finalizado'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <Settings className="w-4 h-4" />
              Perguntas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" /> Controles do Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {settings?.status === 'waiting' && (
                    <Button
                      variant="start"
                      size="xl"
                      onClick={handleStartQuiz}
                      disabled={actionLoading || participants.length === 0}
                      className="min-w-[200px]"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          INICIAR QUIZ
                        </>
                      )}
                    </Button>
                  )}
                  
                  {settings?.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="xl"
                      onClick={handleEndQuiz}
                      disabled={actionLoading}
                      className="min-w-[200px]"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Square className="w-5 h-5" />
                          ENCERRAR QUIZ
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={handleResetQuiz}
                    disabled={actionLoading}
                  >
                    <RotateCcw className="w-5 h-5" />
                    Resetar Quiz
                  </Button>
                </div>
                
                {participants.length === 0 && (
                  <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Aguardando participantes entrarem na sala de espera...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Participants */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total de Participantes</p>
                      <p className="text-4xl font-display font-bold text-foreground">{participants.length}</p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Aline */}
              <Card className="border-l-4 border-l-emerald">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">🌿 Time Aline</p>
                      <p className="text-4xl font-display font-bold text-emerald">{teamScores.aline}</p>
                      <p className="text-sm text-muted-foreground">{teamCounts.aline} participantes</p>
                    </div>
                    {winner === 'aline' && (
                      <div className="w-14 h-14 rounded-full bg-warning flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-cream" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Adelino */}
              <Card className="border-l-4 border-l-warning">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">🔥 Time Adelino</p>
                      <p className="text-4xl font-display font-bold text-warning">{teamScores.adelino}</p>
                      <p className="text-sm text-muted-foreground">{teamCounts.adelino} participantes</p>
                    </div>
                    {winner === 'adelino' && (
                      <div className="w-14 h-14 rounded-full bg-warning flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-cream" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Placar ao Vivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Aline Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Time Aline</span>
                      <span className="font-bold text-emerald">{teamScores.aline} pts</span>
                    </div>
                    <div className="h-8 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${Math.max((teamScores.aline / Math.max(teamScores.aline + teamScores.adelino, 1)) * 100, 5)}%` }}
                      >
                        {teamScores.aline > 0 && (
                          <span className="text-cream text-xs font-bold">{teamScores.aline}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Adelino Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Time Adelino</span>
                      <span className="font-bold text-warning">{teamScores.adelino} pts</span>
                    </div>
                    <div className="h-8 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${Math.max((teamScores.adelino / Math.max(teamScores.aline + teamScores.adelino, 1)) * 100, 5)}%` }}
                      >
                        {teamScores.adelino > 0 && (
                          <span className="text-cream text-xs font-bold">{teamScores.adelino}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Participantes ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="aline">Time Aline</TabsTrigger>
                    <TabsTrigger value="adelino">Time Adelino</TabsTrigger>
                  </TabsList>
                  
                  {['all', 'aline', 'adelino'].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Matrícula</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Time</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Pontos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants
                              .filter((p) => tab === 'all' || p.team === tab)
                              .map((participant) => (
                                <tr key={participant.id} className="border-b hover:bg-muted/50 transition-colors">
                                  <td className="py-3 px-4 font-mono">{participant.matricula}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      participant.team === 'aline' 
                                        ? 'bg-emerald text-cream' 
                                        : 'bg-warning text-cream'
                                    }`}>
                                      {participant.team === 'aline' ? '🌿 Aline' : '🔥 Adelino'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">{getStatusBadge(participant.status)}</td>
                                  <td className="py-3 px-4 text-right font-bold">{participant.score}</td>
                                </tr>
                              ))}
                            {participants.filter((p) => tab === 'all' || p.team === tab).length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                  Nenhum participante encontrado
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <TopicManager />
            <QuestionManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;