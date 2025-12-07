-- Create enum for teams
CREATE TYPE public.team_type AS ENUM ('aline', 'adelino');

-- Create enum for quiz status
CREATE TYPE public.quiz_status AS ENUM ('waiting', 'active', 'finished');

-- Create enum for participant status
CREATE TYPE public.participant_status AS ENUM ('waiting', 'answering', 'finished');

-- Quiz settings table (singleton for global state)
CREATE TABLE public.quiz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status quiz_status NOT NULL DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.quiz_settings (id, status) VALUES ('00000000-0000-0000-0000-000000000001', 'waiting');

-- Participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT NOT NULL UNIQUE,
  team team_type NOT NULL,
  status participant_status NOT NULL DEFAULT 'waiting',
  score INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Answers table (to track individual answers)
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, question_id)
);

-- Enable RLS
ALTER TABLE public.quiz_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (quiz is public, no auth needed)
CREATE POLICY "Anyone can read quiz_settings" ON public.quiz_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can read participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read answers" ON public.answers FOR SELECT USING (true);

-- Public write access (for simplicity in this corporate quiz context)
CREATE POLICY "Anyone can insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can update quiz_settings" ON public.quiz_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can manage topics" ON public.topics FOR ALL USING (true);
CREATE POLICY "Anyone can manage questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Anyone can insert answers" ON public.answers FOR INSERT WITH CHECK (true);

-- Enable realtime for participants and quiz_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_quiz_settings_updated_at
  BEFORE UPDATE ON public.quiz_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample topics and questions
INSERT INTO public.topics (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Segurança do Trabalho'),
  ('22222222-2222-2222-2222-222222222222', 'Meio Ambiente'),
  ('33333333-3333-3333-3333-333333333333', 'Qualidade'),
  ('44444444-4444-4444-4444-444444444444', 'Processos'),
  ('55555555-5555-5555-5555-555555555555', 'Cultura Organizacional');

-- Sample questions for each topic (3 per topic = 15 total)
INSERT INTO public.questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Segurança do Trabalho
('11111111-1111-1111-1111-111111111111', 'Qual é o equipamento de proteção individual mais básico para trabalhos em altura?', 'Luvas', 'Capacete', 'Cinto de segurança', 'Óculos de proteção', 'c'),
('11111111-1111-1111-1111-111111111111', 'O que significa a sigla EPI?', 'Equipamento de Proteção Individual', 'Equipamento de Produção Industrial', 'Elemento de Prevenção Interna', 'Estrutura de Proteção Integrada', 'a'),
('11111111-1111-1111-1111-111111111111', 'Qual a cor do extintor de incêndio para classe B (líquidos inflamáveis)?', 'Verde', 'Vermelho', 'Amarelo', 'Azul', 'b'),
-- Meio Ambiente
('22222222-2222-2222-2222-222222222222', 'Qual é a cor da lixeira para descarte de papel?', 'Verde', 'Azul', 'Vermelho', 'Amarelo', 'b'),
('22222222-2222-2222-2222-222222222222', 'O que significa a política dos 3Rs?', 'Reutilizar, Reciclar, Reduzir', 'Renovar, Restaurar, Recuperar', 'Reagir, Resolver, Registrar', 'Revisar, Refazer, Retornar', 'a'),
('22222222-2222-2222-2222-222222222222', 'Qual é o principal gás causador do efeito estufa?', 'Oxigênio', 'Nitrogênio', 'Dióxido de Carbono', 'Hidrogênio', 'c'),
-- Qualidade
('33333333-3333-3333-3333-333333333333', 'O que significa a sigla ISO?', 'Organização Internacional de Padronização', 'Instituto de Sistemas Operacionais', 'Índice de Satisfação Organizacional', 'Integração de Sistemas Otimizados', 'a'),
('33333333-3333-3333-3333-333333333333', 'Qual ferramenta da qualidade utiliza espinha de peixe?', 'Diagrama de Pareto', 'Diagrama de Ishikawa', 'Fluxograma', 'Histograma', 'b'),
('33333333-3333-3333-3333-333333333333', 'O ciclo PDCA significa:', 'Planejar, Desenvolver, Controlar, Agir', 'Planejar, Fazer, Verificar, Agir', 'Produzir, Desenvolver, Checar, Avaliar', 'Preparar, Definir, Criar, Analisar', 'b'),
-- Processos
('44444444-4444-4444-4444-444444444444', 'O que é um fluxograma?', 'Um relatório financeiro', 'Uma representação gráfica de processos', 'Um documento de RH', 'Uma planilha de custos', 'b'),
('44444444-4444-4444-4444-444444444444', 'Qual é o objetivo principal da padronização de processos?', 'Reduzir custos apenas', 'Garantir consistência e qualidade', 'Aumentar a burocracia', 'Diminuir funcionários', 'b'),
('44444444-4444-4444-4444-444444444444', 'O que significa KPI?', 'Controle de Produção Interna', 'Indicador Chave de Desempenho', 'Conhecimento Profissional Integrado', 'Kit de Proteção Individual', 'b'),
-- Cultura Organizacional
('55555555-5555-5555-5555-555555555555', 'O que compõe a missão de uma empresa?', 'Seus lucros anuais', 'Sua razão de existir e propósito', 'Seus produtos apenas', 'Seu endereço físico', 'b'),
('55555555-5555-5555-5555-555555555555', 'Qual é a importância dos valores organizacionais?', 'Definir preços de produtos', 'Orientar comportamentos e decisões', 'Calcular salários', 'Definir horários de trabalho', 'b'),
('55555555-5555-5555-5555-555555555555', 'O trabalho em equipe é importante porque:', 'Diminui responsabilidades individuais', 'Combina diferentes habilidades para melhores resultados', 'Permite trabalhar menos', 'Elimina a necessidade de liderança', 'b');