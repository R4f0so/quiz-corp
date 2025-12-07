import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Participant, QuizSettings, Question, TeamScores, TeamType, QuizStatus } from '@/lib/types';

const QUIZ_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function useQuizSettings() {
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('quiz_settings')
        .select('*')
        .eq('id', QUIZ_SETTINGS_ID)
        .single();
      
      if (data) {
        setSettings(data as unknown as QuizSettings);
      }
      setLoading(false);
    };

    fetchSettings();

    // Real-time subscription
    const channel = supabase
      .channel('quiz_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_settings',
          filter: `id=eq.${QUIZ_SETTINGS_ID}`,
        },
        (payload) => {
          setSettings(payload.new as unknown as QuizSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (status: QuizStatus) => {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'active') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'finished') {
      updates.finished_at = new Date().toISOString();
    } else if (status === 'waiting') {
      updates.started_at = null;
      updates.finished_at = null;
    }

    await supabase
      .from('quiz_settings')
      .update(updates)
      .eq('id', QUIZ_SETTINGS_ID);
  };

  return { settings, loading, updateStatus };
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setParticipants(data as unknown as Participant[]);
      }
      setLoading(false);
    };

    fetchParticipants();

    // Real-time subscription
    const channel = supabase
      .channel('participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants((prev) => [payload.new as unknown as Participant, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new as unknown as Participant : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const teamScores: TeamScores = participants.reduce(
    (acc, p) => {
      acc[p.team] += p.score;
      return acc;
    },
    { aline: 0, adelino: 0 }
  );

  const teamCounts = {
    aline: participants.filter((p) => p.team === 'aline').length,
    adelino: participants.filter((p) => p.team === 'adelino').length,
  };

  return { participants, loading, teamScores, teamCounts };
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from('questions').select('*');
      
      if (data) {
        // Shuffle questions
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled as unknown as Question[]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, []);

  return { questions, loading };
}

export function useParticipantLogin() {
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing participant in localStorage
  useEffect(() => {
    const storedMatricula = localStorage.getItem('quiz_matricula');
    if (storedMatricula) {
      loadParticipant(storedMatricula);
    }
  }, []);

  const loadParticipant = async (matricula: string) => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('matricula', matricula)
      .single();
    
    if (data) {
      setCurrentParticipant(data as unknown as Participant);
      localStorage.setItem('quiz_matricula', matricula);
    }
    return data as unknown as Participant | null;
  };

  const login = async (matricula: string, team?: TeamType): Promise<{ participant: Participant | null; error: string | null; isNew: boolean }> => {
    setLoading(true);
    
    // Check if participant exists
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('matricula', matricula)
      .single();

    if (existing) {
      // Update connection status
      await supabase
        .from('participants')
        .update({ is_connected: true, last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);
      
      setCurrentParticipant(existing as unknown as Participant);
      localStorage.setItem('quiz_matricula', matricula);
      setLoading(false);
      return { participant: existing as unknown as Participant, error: null, isNew: false };
    }

    // Create new participant if team is provided
    if (!team) {
      setLoading(false);
      return { participant: null, error: 'Team selection required for new participants', isNew: true };
    }

    const { data: newParticipant, error } = await supabase
      .from('participants')
      .insert({ matricula, team })
      .select()
      .single();

    if (error) {
      setLoading(false);
      return { participant: null, error: error.message, isNew: true };
    }

    setCurrentParticipant(newParticipant as unknown as Participant);
    localStorage.setItem('quiz_matricula', matricula);
    setLoading(false);
    return { participant: newParticipant as unknown as Participant, error: null, isNew: true };
  };

  const updateStatus = async (status: Participant['status']) => {
    if (!currentParticipant) return;
    
    await supabase
      .from('participants')
      .update({ status })
      .eq('id', currentParticipant.id);
  };

  const addScore = async (points: number) => {
    if (!currentParticipant) return;
    
    const newScore = currentParticipant.score + points;
    await supabase
      .from('participants')
      .update({ score: newScore })
      .eq('id', currentParticipant.id);
    
    setCurrentParticipant((prev) => prev ? { ...prev, score: newScore } : null);
  };

  const logout = () => {
    localStorage.removeItem('quiz_matricula');
    setCurrentParticipant(null);
  };

  return { currentParticipant, loading, login, updateStatus, addScore, logout, loadParticipant };
}