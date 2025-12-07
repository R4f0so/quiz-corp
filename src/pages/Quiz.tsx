import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useParticipantLogin, useQuizSettings, useQuestions } from '@/hooks/useQuiz';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import type { Question } from '@/lib/types';

const POINTS_PER_CORRECT = 100;

const Quiz = () => {
  const navigate = useNavigate();
  const { currentParticipant, updateStatus, addScore } = useParticipantLogin();
  const { settings, loading: settingsLoading } = useQuizSettings();
  const { questions, loading: questionsLoading } = useQuestions();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

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

  // Set status to answering on mount
  useEffect(() => {
    if (currentParticipant) {
      updateStatus('answering');
    }
  }, []);

  // Load already answered questions
  useEffect(() => {
    if (currentParticipant) {
      const loadAnswered = async () => {
        const { data } = await supabase
          .from('answers')
          .select('question_id')
          .eq('participant_id', currentParticipant.id);
        
        if (data) {
          setAnsweredQuestions(new Set(data.map((a) => a.question_id)));
        }
      };
      loadAnswered();
    }
  }, [currentParticipant]);

  if (settingsLoading || questionsLoading || !currentParticipant) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-cream" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelectOption = (option: 'a' | 'b' | 'c' | 'd') => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correct_option;
    
    // Save answer
    await supabase.from('answers').insert({
      participant_id: currentParticipant.id,
      question_id: currentQuestion.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });

    // Add score if correct
    if (isCorrect) {
      await addScore(POINTS_PER_CORRECT);
    }

    setIsAnswered(true);
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion.id));
  };

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      console.log('Última pergunta! Indo para /waiting');
      await updateStatus('finished');
      navigate('/waiting');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const getOptionVariant = (option: 'a' | 'b' | 'c' | 'd') => {
    if (!isAnswered) {
      return selectedOption === option ? 'quizSelected' : 'quiz';
    }
    
    if (option === currentQuestion.correct_option) {
      return 'quizCorrect';
    }
    
    if (option === selectedOption && selectedOption !== currentQuestion.correct_option) {
      return 'quizWrong';
    }
    
    return 'quiz';
  };

  const options = [
    { key: 'a' as const, text: currentQuestion?.option_a },
    { key: 'b' as const, text: currentQuestion?.option_b },
    { key: 'c' as const, text: currentQuestion?.option_c },
    { key: 'd' as const, text: currentQuestion?.option_d },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-forest p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning-light" />
            <span className="text-cream font-display font-bold">Quiz</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            currentParticipant.team === 'aline' 
              ? 'bg-emerald text-cream' 
              : 'bg-warning text-cream'
          }`}>
            {currentParticipant.score} pts
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-cream/70">
            <span>Pergunta {currentIndex + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-cream/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-success to-warning-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {currentQuestion && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Question */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-lg font-display font-bold text-foreground leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map(({ key, text }) => (
                <Button
                  key={key}
                  variant={getOptionVariant(key)}
                  className="w-full min-h-[60px] animate-slide-up"
                  style={{ animationDelay: `${options.findIndex(o => o.key === key) * 0.05}s` }}
                  onClick={() => handleSelectOption(key)}
                  disabled={isAnswered}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {key.toUpperCase()}
                    </span>
                    <span className="text-left flex-1">{text}</span>
                    {isAnswered && key === currentQuestion.correct_option && (
                      <CheckCircle className="w-5 h-5 text-cream flex-shrink-0" />
                    )}
                    {isAnswered && key === selectedOption && key !== currentQuestion.correct_option && (
                      <XCircle className="w-5 h-5 text-cream flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            {/* Feedback */}
            {isAnswered && (
              <div className={`rounded-xl p-4 text-center animate-scale-in ${
                selectedOption === currentQuestion.correct_option 
                  ? 'bg-success/20 text-success' 
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {selectedOption === currentQuestion.correct_option ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Correto! +{POINTS_PER_CORRECT} pontos</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold">Incorreto!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="p-4 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto">
          {!isAnswered ? (
            <Button
              variant="hero"
              size="full"
              onClick={handleConfirmAnswer}
              disabled={!selectedOption}
            >
              Confirmar Resposta
            </Button>
          ) : (
            <Button
              variant="hero"
              size="full"
              onClick={handleNextQuestion}
            >
              {isLastQuestion ? 'Ver Resultado' : 'Próxima Pergunta'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Quiz;