import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizSettings, useParticipantLogin, useQuestions } from "@/hooks/useQuiz";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Waiting = () => {
  const navigate = useNavigate();
  const { settings } = useQuizSettings();
  const { currentParticipant } = useParticipantLogin();
  const { questions } = useQuestions();
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    if (!currentParticipant) {
      navigate("/");
      return;
    }

    // Calcular respostas corretas
    const fetchAnswers = async () => {
      const { data } = await supabase
        .from('answers')
        .select('is_correct')
        .eq('participant_id', currentParticipant.id);
      
      if (data) {
        const correct = data.filter(a => a.is_correct).length;
        setCorrectAnswers(correct);
      }
    };

    fetchAnswers();
  }, [currentParticipant, navigate]);

  useEffect(() => {
    // Se admin finalizar, vai para results
    if (settings?.status === "finished") {
      navigate("/results");
    }

    // Se admin resetar, limpa sessão e volta pro login
    if (settings?.status === "waiting") {
      localStorage.removeItem('quiz_matricula');
      navigate("/");
    }
  }, [settings?.status, navigate]);

  const totalQuestions = questions.length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const score = currentParticipant?.score || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Quiz Finalizado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-block p-6 bg-emerald-100 rounded-full">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
            
            <h2 className="text-xl font-semibold">Aguardando outros jogadores...</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Seu Desempenho</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600">{score}</div>
                  <div className="text-sm text-gray-600">Pontos</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-sm text-gray-600">Acertos</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{wrongAnswers}</div>
                  <div className="text-sm text-gray-600">Erros</div>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              O resultado final será exibido quando todos terminarem!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Waiting;