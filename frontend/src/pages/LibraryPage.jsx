import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/App';
import {
  Music2,
  Plus,
  LogOut,
  Search,
  FileText,
  CheckCircle,
  Circle,
  Disc,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';

const LibraryPage = ({ user }) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usedFilter, setUsedFilter] = useState('all');

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${API}/songs`);
      setSongs(response.data);
    } catch (error) {
      console.error('Fetch songs error:', error);
      toast.error('Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
    }
  };

  // Filter songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || song.status === statusFilter;
    const matchesUsed = usedFilter === 'all' || 
      (usedFilter === 'used' && song.used_in_final_track) ||
      (usedFilter === 'unused' && !song.used_in_final_track);
    return matchesSearch && matchesStatus && matchesUsed;
  });

  return (
    <div className="min-h-screen bg-background" data-testid="library-page">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/generate')}
                className="text-muted-foreground hover:text-foreground"
                data-testid="back-to-generate-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight font-['Outfit']">LyricLab</span>
                  <p className="text-xs text-muted-foreground">Your Library</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/generate')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                data-testid="new-song-header-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Song
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/50 border-transparent focus:border-primary"
              data-testid="search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px] bg-input/50 border-transparent" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={usedFilter} onValueChange={setUsedFilter}>
            <SelectTrigger className="w-full md:w-[150px] bg-input/50 border-transparent" data-testid="used-filter">
              <SelectValue placeholder="Track Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Songs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-12 h-12 text-primary/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold font-['Outfit']">
                {songs.length === 0 ? 'No songs yet' : 'No matching songs'}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {songs.length === 0 
                  ? "Start creating your first song and it will appear here."
                  : "Try adjusting your filters or search query."
                }
              </p>
            </div>
            {songs.length === 0 && (
              <Button
                onClick={() => navigate('/generate')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
                data-testid="create-first-song-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Song
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSongs.map((song) => (
              <SongCard key={song.song_id} song={song} onClick={() => navigate(`/song/${song.song_id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const SongCard = ({ song, onClick }) => {
  const createdDate = new Date(song.created_at);
  const formattedDate = format(createdDate, 'MMM d, yyyy');
  const formattedTime = format(createdDate, 'h:mm a');

  return (
    <div
      onClick={onClick}
      className="group relative bg-card hover:bg-card/80 border border-border/50 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
      data-testid={`song-card-${song.song_id}`}
    >
      {/* Used indicator */}
      {song.used_in_final_track && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" title="Used in final track" />
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Disc className="w-7 h-7 text-primary" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg font-['Outfit'] mb-2 line-clamp-1 group-hover:text-primary transition-colors">
        {song.title || 'Untitled Song'}
      </h3>

      {/* Date */}
      <p className="text-sm text-muted-foreground mb-4">
        {formattedDate} at {formattedTime}
      </p>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge 
          variant={song.status === 'done' ? 'default' : 'secondary'}
          className={song.status === 'done' ? 'bg-primary/20 text-primary border-primary/30' : ''}
        >
          {song.status === 'done' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <Circle className="w-3 h-3 mr-1" />
          )}
          {song.status === 'done' ? 'Done' : 'Draft'}
        </Badge>
        
        {song.used_in_final_track && (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            Used
          </Badge>
        )}
      </div>

      {/* Genre tag if available */}
      {song.song_spec_json?.genre && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {song.song_spec_json.subgenre ? `${song.song_spec_json.subgenre}` : song.song_spec_json.genre}
          </span>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
