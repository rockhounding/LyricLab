import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/App';
import { Music2, Menu } from 'lucide-react';
import { SongSpecPanel } from '@/components/SongSpecPanel';
import { LyricsPanel } from '@/components/LyricsPanel';
import { GENRES, defaultSongSpec } from '@/data/songData';

function GeneratePage({ user }) {
  var navigate = useNavigate();
  var [songSpec, setSongSpec] = useState(defaultSongSpec);
  var [lyrics, setLyrics] = useState('');
  var [isGenerating, setIsGenerating] = useState(false);
  var [isSaving, setIsSaving] = useState(false);
  var [currentSongId, setCurrentSongId] = useState(null);
  var [forbiddenWordInput, setForbiddenWordInput] = useState('');
  var [customMoodInput, setCustomMoodInput] = useState('');
  var [showMobileControls, setShowMobileControls] = useState(false);
  var [availableSubgenres, setAvailableSubgenres] = useState([]);
  var [variations, setVariations] = useState([]);
  var [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  useEffect(function() {
    if (songSpec.genre && GENRES[songSpec.genre]) {
      setAvailableSubgenres(GENRES[songSpec.genre]);
    } else {
      setAvailableSubgenres([]);
    }
  }, [songSpec.genre]);

  var updateSpec = useCallback(function(key, value) {
    setSongSpec(function(prev) { return { ...prev, [key]: value }; });
  }, []);

  function addForbiddenWord() {
    var trimmed = forbiddenWordInput.trim();
    if (trimmed && !songSpec.forbidden_words.includes(trimmed)) {
      updateSpec('forbidden_words', [...songSpec.forbidden_words, trimmed]);
      setForbiddenWordInput('');
    }
  }

  function removeForbiddenWord(word) {
    updateSpec('forbidden_words', songSpec.forbidden_words.filter(function(w) { return w !== word; }));
  }

  function addCustomMood() {
    var trimmed = customMoodInput.trim();
    if (trimmed) {
      updateSpec('custom_mood', trimmed);
      updateSpec('mood', '');
      setCustomMoodInput('');
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      var response = await axios.post(API + '/lyrics/generate', { song_spec: songSpec });
      setLyrics(response.data.lyrics);
      toast.success('Lyrics generated!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate lyrics');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRewrite() {
    if (!lyrics.trim()) {
      toast.error('No lyrics to rewrite');
      return;
    }
    setIsGenerating(true);
    try {
      var response = await axios.post(API + '/lyrics/rewrite', { song_spec: songSpec, current_lyrics: lyrics });
      setLyrics(response.data.lyrics);
      toast.success('Lyrics rewritten!');
    } catch (error) {
      console.error('Rewrite error:', error);
      toast.error('Failed to rewrite lyrics');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRewriteSection(section, rhymeScheme) {
    if (!lyrics.trim()) {
      toast.error('No lyrics to rewrite');
      return;
    }
    setIsGenerating(true);
    try {
      var response = await axios.post(API + '/lyrics/rewrite-section', { 
        song_spec: songSpec, 
        current_lyrics: lyrics, 
        section: section,
        section_rhyme_scheme: rhymeScheme
      });
      setLyrics(response.data.lyrics);
      var msg = section + ' rewritten';
      if (rhymeScheme) msg += ' with ' + rhymeScheme + ' rhyme scheme';
      toast.success(msg + '!');
    } catch (error) {
      console.error('Rewrite section error:', error);
      toast.error('Failed to rewrite section');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateVariations(section, rhymeScheme) {
    if (!lyrics.trim()) {
      toast.error('No lyrics to generate variations from');
      return;
    }
    setIsGeneratingVariations(true);
    setVariations([]);
    try {
      var response = await axios.post(API + '/lyrics/variations', {
        song_spec: songSpec,
        current_lyrics: lyrics,
        section: section,
        section_rhyme_scheme: rhymeScheme,
        count: 4
      });
      setVariations(response.data.variations);
      if (response.data.variations.length === 0) {
        toast.error('Could not generate variations');
      } else {
        toast.success('Generated ' + response.data.variations.length + ' variations!');
      }
    } catch (error) {
      console.error('Variations error:', error);
      toast.error('Failed to generate variations');
    } finally {
      setIsGeneratingVariations(false);
    }
  }

  function clearVariations() {
    setVariations([]);
  }

  async function handleCustomEdit(section, prompt) {
    if (!lyrics.trim()) {
      toast.error('No lyrics to edit');
      return;
    }
    setIsGenerating(true);
    try {
      var response = await axios.post(API + '/lyrics/custom-edit', {
        song_spec: songSpec,
        current_lyrics: lyrics,
        section: section,
        prompt: prompt
      });
      setLyrics(response.data.lyrics);
      var msg = section ? section + ' edited' : 'Song edited';
      toast.success(msg + '!');
    } catch (error) {
      console.error('Custom edit error:', error);
      toast.error('Failed to apply edit');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleTransform(options) {
    if (!lyrics.trim()) {
      toast.error('No lyrics to transform');
      return;
    }
    setIsGenerating(true);
    try {
      var response = await axios.post(API + '/lyrics/transform', {
        current_lyrics: lyrics,
        new_topic: options.newTopic,
        new_mood: options.newMood,
        new_genre: options.newGenre,
        keep_cadence: options.keepCadence,
        keep_rhyme_scheme: options.keepRhyme,
        keep_structure: options.keepStructure,
        additional_instructions: options.additionalInstructions
      });
      setLyrics(response.data.lyrics);
      toast.success('Lyrics transformed!');
    } catch (error) {
      console.error('Transform error:', error);
      toast.error('Failed to transform lyrics');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave(status) {
    if (!lyrics.trim()) {
      toast.error('No lyrics to save');
      return;
    }
    setIsSaving(true);
    try {
      var title = songSpec.title || 'Untitled Song';
      if (currentSongId) {
        await axios.put(API + '/songs/' + currentSongId, { title: title, lyrics_text: lyrics, song_spec: songSpec, status: status });
        toast.success(status === 'done' ? 'Song marked as done!' : 'Draft saved!');
      } else {
        var response = await axios.post(API + '/songs', { title: title, lyrics_text: lyrics, song_spec: songSpec });
        setCurrentSongId(response.data.song_id);
        if (status === 'done') {
          await axios.put(API + '/songs/' + response.data.song_id, { status: 'done' });
          toast.success('Song saved and marked as done!');
        } else {
          toast.success('Draft saved!');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await axios.post(API + '/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/', { replace: true });
  }

  function handleNewSong() {
    setSongSpec(defaultSongSpec);
    setLyrics('');
    setCurrentSongId(null);
    setVariations([]);
    toast.success('Started new song');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row" data-testid="generate-page">
      <MobileHeader showMobileControls={showMobileControls} setShowMobileControls={setShowMobileControls} />
      <SongSpecPanel
        showMobileControls={showMobileControls}
        songSpec={songSpec}
        updateSpec={updateSpec}
        availableSubgenres={availableSubgenres}
        forbiddenWordInput={forbiddenWordInput}
        setForbiddenWordInput={setForbiddenWordInput}
        addForbiddenWord={addForbiddenWord}
        removeForbiddenWord={removeForbiddenWord}
        customMoodInput={customMoodInput}
        setCustomMoodInput={setCustomMoodInput}
        addCustomMood={addCustomMood}
        navigate={navigate}
        handleNewSong={handleNewSong}
        handleLogout={handleLogout}
      />
      <LyricsPanel
        lyrics={lyrics}
        setLyrics={setLyrics}
        isGenerating={isGenerating}
        isSaving={isSaving}
        handleGenerate={handleGenerate}
        handleRewrite={handleRewrite}
        handleRewriteSection={handleRewriteSection}
        handleSave={handleSave}
        handleGenerateVariations={handleGenerateVariations}
        handleCustomEdit={handleCustomEdit}
        handleTransform={handleTransform}
        variations={variations}
        isGeneratingVariations={isGeneratingVariations}
        clearVariations={clearVariations}
      />
    </div>
  );
}

function MobileHeader({ showMobileControls, setShowMobileControls }) {
  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music2 className="w-4 h-4 text-primary" />
        </div>
        <span className="font-bold font-['Outfit']">LyricLab</span>
      </div>
      <Button variant="ghost" size="icon" onClick={function() { setShowMobileControls(!showMobileControls); }} data-testid="mobile-controls-toggle">
        <Menu className="w-5 h-5" />
      </Button>
    </div>
  );
}

export default GeneratePage;
