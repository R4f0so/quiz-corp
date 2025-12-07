export type TeamType = 'aline' | 'adelino';
export type QuizStatus = 'waiting' | 'active' | 'finished';
export type ParticipantStatus = 'waiting' | 'answering' | 'finished';

export interface Participant {
  id: string;
  matricula: string;
  team: TeamType;
  status: ParticipantStatus;
  score: number;
  is_connected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuizSettings {
  id: string;
  status: QuizStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  created_at: string;
}

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  participant_id: string;
  question_id: string;
  selected_option: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
  created_at: string;
}

export interface TeamScores {
  aline: number;
  adelino: number;
}