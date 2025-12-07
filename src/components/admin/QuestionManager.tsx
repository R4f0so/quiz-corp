import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, HelpCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  topic_id: string;
  topics?: Topic;
}

const emptyQuestion = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  topic_id: '',
};

const QuestionManager = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState(emptyQuestion);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [topicsRes, questionsRes] = await Promise.all([
      supabase.from('topics').select('*').order('name'),
      supabase.from('questions').select('*, topics(id, name)').order('created_at', { ascending: false }),
    ]);

    if (topicsRes.error) console.error(topicsRes.error);
    if (questionsRes.error) console.error(questionsRes.error);

    setTopics(topicsRes.data || []);
    setQuestions(questionsRes.data || []);
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingQuestion(null);
    setFormData({ ...emptyQuestion, topic_id: topics[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option.toUpperCase(),
      topic_id: question.topic_id,
    });
    setDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formData.question_text.trim() || !formData.topic_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.option_a.trim() || !formData.option_b.trim() || 
        !formData.option_c.trim() || !formData.option_d.trim()) {
      toast.error('Preencha todas as alternativas');
      return;
    }

    setActionLoading(true);

    const dataToSave = {
      ...formData,
      correct_option: formData.correct_option.toLowerCase(),
    };

    if (editingQuestion) {
      const { error } = await supabase
        .from('questions')
        .update(dataToSave)
        .eq('id', editingQuestion.id);

      if (error) {
        toast.error('Erro ao atualizar pergunta');
        console.error(error);
      } else {
        toast.success('Pergunta atualizada!');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('questions').insert(dataToSave);

      if (error) {
        toast.error('Erro ao adicionar pergunta');
        console.error(error);
      } else {
        toast.success('Pergunta adicionada!');
        setDialogOpen(false);
        fetchData();
      }
    }

    setActionLoading(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    setActionLoading(true);
    
    // Delete related answers first
    await supabase.from('answers').delete().eq('question_id', id);
    
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir pergunta');
      console.error(error);
    } else {
      toast.success('Pergunta excluída!');
      fetchData();
    }
    setActionLoading(false);
  };

  const filteredQuestions = filterTopic === 'all' 
    ? questions 
    : questions.filter(q => q.topic_id === filterTopic);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> Gerenciar Perguntas ({filteredQuestions.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterTopic} onValueChange={setFilterTopic}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tópico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tópicos</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} disabled={topics.length === 0}>
                  <Plus className="w-4 h-4" />
                  Nova Pergunta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tópico *</Label>
                    <Select
                      value={formData.topic_id}
                      onValueChange={(value) => setFormData({ ...formData, topic_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tópico" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pergunta *</Label>
                    <Textarea
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      placeholder="Digite a pergunta..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alternativa A *</Label>
                      <Input
                        value={formData.option_a}
                        onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                        placeholder="Alternativa A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alternativa B *</Label>
                      <Input
                        value={formData.option_b}
                        onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                        placeholder="Alternativa B"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alternativa C *</Label>
                      <Input
                        value={formData.option_c}
                        onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                        placeholder="Alternativa C"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alternativa D *</Label>
                      <Input
                        value={formData.option_d}
                        onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                        placeholder="Alternativa D"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Resposta Correta *</Label>
                    <RadioGroup
                      value={formData.correct_option}
                      onValueChange={(value) => setFormData({ ...formData, correct_option: value })}
                      className="flex flex-wrap gap-4"
                    >
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${option}`} />
                          <Label htmlFor={`option-${option}`} className="cursor-pointer">
                            Alternativa {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveQuestion} disabled={actionLoading}>
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingQuestion ? (
                        'Salvar'
                      ) : (
                        'Adicionar'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Crie pelo menos um tópico antes de adicionar perguntas
          </p>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma pergunta cadastrada
          </p>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className="p-4 bg-muted/50 rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {(question.topics as Topic | undefined)?.name || 'Sem tópico'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="font-medium">{question.question_text}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div
                          key={opt}
                          className={`p-2 rounded ${
                            question.correct_option === opt
                              ? 'bg-success/20 text-success border border-success/30'
                              : 'bg-background'
                          }`}
                        >
                          <span className="font-bold">{opt}.</span>{' '}
                          {String(question[`option_${opt.toLowerCase()}` as keyof Question])}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(question)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={actionLoading}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionManager;