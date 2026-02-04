import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/App';
import {
  Music2,
  ArrowLeft,
  Save,
  Copy,
  Trash2,
  CheckCircle,
  Circle,
  Loader2,
  Edit2,
  History,
  CopyPlus,
} from 'lucide-react';
import { format } from 'date-fns';

const SongDetailPage = ({ user }) => {
  const navigate = useNavigate();
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedLyrics, setEditedLyrics] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  useEffect(() => {
    fetchSong();
  }, [songId]);

  const fetchSong = async () => {
    try {
      const response = await axios.get(`${API}/songs/${songId}`);
      setSong(response.data);
      setEditedTitle(response.data.title);
      setEditedLyrics(response.data.lyrics_text);
    } catch (error) {
      console.error('Fetch song error:', error);
      toast.error('Failed to load song');
      navigate('/library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`${API}/songs/${songId}`, {
        title: editedTitle,
        lyrics_text: editedLyrics
      });
      setSong(response.data);
      setIsEditing(false);
      toast.success('Song saved!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = song.status === 'done' ? 'draft' : 'done';
    try {
      const response = await axios.put(`${API}/songs/${songId}`, {
        status: newStatus
      });
      setSong(response.data);
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleUsedToggle = async () => {
    try {
      const response = await axios.put(`${API}/songs/${songId}`, {
        used_in_final_track: !song.used_in_final_track
      });
      setSong(response.data);
      toast.success(response.data.used_in_final_track ? 'Marked as used' : 'Marked as unused');
    } catch (error) {
      console.error('Used toggle error:', error);
      toast.error('Failed to update');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await axios.post(`${API}/songs/${songId}/duplicate`);
      toast.success('Song duplicated!');
      navigate(`/song/${response.data.song_id}`);
    } catch (error) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API}/songs/${songId}`);
      toast.success('Song deleted');
      navigate('/library');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(song.lyrics_text);
    toast.success('Lyrics copied to clipboard!');
  };

  const handleRestoreVersion = async (version) => {
    setEditedLyrics(version.lyrics_text);
    setIsEditing(true);
    setShowHistoryDialog(false);
    toast.info('Version restored. Click Save to confirm.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!song) {
    return null;
  }

  const createdDate = new Date(song.created_at);
  const updatedDate = new Date(song.updated_at);

  return (
    <div className="min-h-screen bg-background" data-testid="song-detail-page">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/library')}
                className="text-muted-foreground hover:text-foreground"
                data-testid="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight font-['Outfit']">LyricLab</span>
                  <p className="text-xs text-muted-foreground">Song Details</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTitle(song.title);
                      setEditedLyrics(song.lyrics_text);
                    }}
                    data-testid="cancel-edit-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="save-btn"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    data-testid="edit-btn"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    data-testid="duplicate-btn"
                  >
                    <CopyPlus className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    data-testid="copy-btn"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Song Info Card */}
          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-3xl font-bold font-['Outfit'] bg-transparent border-transparent focus:border-primary h-auto py-2 px-0"
                    placeholder="Song title..."
                    data-testid="title-input"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] mb-4">
                    {song.title || 'Untitled Song'}
                  </h1>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>Created {format(createdDate, 'MMM d, yyyy')} at {format(createdDate, 'h:mm a')}</span>
                  {song.updated_at !== song.created_at && (
                    <span>• Updated {format(updatedDate, 'MMM d, yyyy')}</span>
                  )}
                </div>

                {/* Genre info */}
                {song.song_spec_json?.genre && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">{song.song_spec_json.genre}</Badge>
                    {song.song_spec_json.subgenre && (
                      <Badge variant="outline">{song.song_spec_json.subgenre}</Badge>
                    )}
                    {(song.song_spec_json.mood || song.song_spec_json.custom_mood) && (
                      <Badge variant="outline">{song.song_spec_json.custom_mood || song.song_spec_json.mood}</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Status toggles */}
              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    {song.status === 'done' ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Label>Status</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{song.status === 'done' ? 'Done' : 'Draft'}</span>
                    <Switch
                      checked={song.status === 'done'}
                      onCheckedChange={handleStatusToggle}
                      data-testid="status-toggle"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
                  <Label>Used in track</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{song.used_in_final_track ? 'Yes' : 'No'}</span>
                    <Switch
                      checked={song.used_in_final_track}
                      onCheckedChange={handleUsedToggle}
                      className={song.used_in_final_track ? '[&_span]:bg-emerald-500' : ''}
                      data-testid="used-toggle"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="bg-card/30 border border-border/50 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-['Outfit']">Lyrics</h2>
              {song.version_history && song.version_history.length > 0 && (
                <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="history-btn">
                      <History className="w-4 h-4 mr-2" />
                      History ({song.version_history.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Version History</DialogTitle>
                      <DialogDescription>
                        Previous versions of your lyrics (last 3 saved)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {song.version_history.slice().reverse().map((version, index) => (
                        <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(version.saved_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              data-testid={`restore-version-${index}`}
                            >
                              Restore
                            </Button>
                          </div>
                          <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground line-clamp-6">
                            {version.lyrics_text}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {isEditing ? (
              <Textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="min-h-[500px] bg-transparent border-none focus:ring-0 resize-none lyrics-editor text-lg leading-loose"
                placeholder="Enter your lyrics..."
                data-testid="lyrics-textarea"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-lg leading-loose">
                {song.lyrics_text || 'No lyrics yet'}
              </pre>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-8 p-6 rounded-2xl border border-destructive/30 bg-destructive/5">
            <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="delete-btn">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Song
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Song?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete "{song.title}" and all its version history.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    data-testid="confirm-delete-btn"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SongDetailPage;
