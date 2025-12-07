import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, BookOpen, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
  created_at: string;
}

const TopicManager = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar tópicos');
      console.error(error);
    } else {
      setTopics(data || []);
    }
    setLoading(false);
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) {
      toast.error('Digite o nome do tópico');
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('topics')
      .insert({ name: newTopicName.trim() });

    if (error) {
      toast.error('Erro ao adicionar tópico');
      console.error(error);
    } else {
      toast.success('Tópico adicionado!');
      setNewTopicName('');
      fetchTopics();
    }
    setActionLoading(false);
  };

  const handleEditTopic = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Digite o nome do tópico');
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('topics')
      .update({ name: editingName.trim() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao editar tópico');
      console.error(error);
    } else {
      toast.success('Tópico atualizado!');
      setEditingId(null);
      fetchTopics();
    }
    setActionLoading(false);
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o tópico "${name}"? Todas as perguntas deste tópico também serão excluídas.`)) {
      return;
    }

    setActionLoading(true);
    
    // First delete all questions for this topic
    await supabase.from('questions').delete().eq('topic_id', id);
    
    // Then delete the topic
    const { error } = await supabase.from('topics').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir tópico');
      console.error(error);
    } else {
      toast.success('Tópico excluído!');
      fetchTopics();
    }
    setActionLoading(false);
  };

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
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Gerenciar Tópicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new topic */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo tópico"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            className="flex-1"
          />
          <Button onClick={handleAddTopic} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>

        {/* Topics list */}
        <div className="space-y-2">
          {topics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum tópico cadastrado</p>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                {editingId === topic.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditTopic(topic.id)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditTopic(topic.id)}
                      disabled={actionLoading}
                    >
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{topic.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(topic.id);
                          setEditingName(topic.name);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTopic(topic.id, topic.name)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicManager;