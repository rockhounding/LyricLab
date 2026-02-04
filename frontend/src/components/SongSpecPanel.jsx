import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, LogOut, Plus, X, Library } from 'lucide-react';
import { SliderControl } from '@/components/SliderControl';
import { StructureBuilder } from '@/components/StructureBuilder';
import { GENRES, MOODS, PERSPECTIVES, RHYME_SCHEMES, PROFANITY_OPTIONS } from '@/data/songData';

export function SongSpecPanel({
  showMobileControls,
  songSpec,
  updateSpec,
  availableSubgenres,
  forbiddenWordInput,
  setForbiddenWordInput,
  addForbiddenWord,
  removeForbiddenWord,
  customMoodInput,
  setCustomMoodInput,
  addCustomMood,
  navigate,
  handleNewSong,
  handleLogout
}) {
  var genreOptions = Object.keys(GENRES);
  var panelClass = showMobileControls ? 'block' : 'hidden';

  return (
    <div className={panelClass + ' lg:block w-full lg:w-[400px] xl:w-[450px] bg-card/30 border-r border-border/50 lg:h-screen lg:sticky lg:top-0 overflow-y-auto scrollbar-hide'}>
      <div className="p-6 space-y-8">
        <DesktopHeader />
        <NavButtons navigate={navigate} handleNewSong={handleNewSong} handleLogout={handleLogout} />
        <BasicControls songSpec={songSpec} updateSpec={updateSpec} genreOptions={genreOptions} availableSubgenres={availableSubgenres} />
        <MoodControl songSpec={songSpec} updateSpec={updateSpec} customMoodInput={customMoodInput} setCustomMoodInput={setCustomMoodInput} addCustomMood={addCustomMood} />
        <DropdownControls songSpec={songSpec} updateSpec={updateSpec} />
        <SliderControls songSpec={songSpec} updateSpec={updateSpec} />
        <AdditionalControls songSpec={songSpec} updateSpec={updateSpec} forbiddenWordInput={forbiddenWordInput} setForbiddenWordInput={setForbiddenWordInput} addForbiddenWord={addForbiddenWord} removeForbiddenWord={removeForbiddenWord} />
      </div>
    </div>
  );
}

function DesktopHeader() {
  return (
    <div className="hidden lg:flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Music2 className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight font-['Outfit']">LyricLab</span>
      </div>
    </div>
  );
}

function NavButtons({ navigate, handleNewSong, handleLogout }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="ghost" size="sm" onClick={function() { navigate('/library'); }} className="text-muted-foreground hover:text-foreground" data-testid="library-nav-btn">
        <Library className="w-4 h-4 mr-2" />Library
      </Button>
      <Button variant="ghost" size="sm" onClick={handleNewSong} className="text-muted-foreground hover:text-foreground" data-testid="new-song-btn">
        <Plus className="w-4 h-4 mr-2" />New
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground" data-testid="logout-btn">
        <LogOut className="w-4 h-4 mr-2" />Sign Out
      </Button>
    </div>
  );
}

function BasicControls({ songSpec, updateSpec, genreOptions, availableSubgenres }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Song Title</Label>
        <Input placeholder="Enter song title..." value={songSpec.title} onChange={function(e) { updateSpec('title', e.target.value); }} className="bg-input/50 border-transparent focus:border-primary" data-testid="song-title-input" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topic / Theme</Label>
        <Textarea placeholder="What's your song about?" value={songSpec.topic} onChange={function(e) { updateSpec('topic', e.target.value); }} className="bg-input/50 border-transparent focus:border-primary min-h-[80px] resize-none" data-testid="song-topic-input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Genre</Label>
          <Select value={songSpec.genre} onValueChange={function(v) { updateSpec('genre', v); updateSpec('subgenre', ''); }}>
            <SelectTrigger className="bg-input/50 border-transparent" data-testid="genre-select"><SelectValue placeholder="Select genre" /></SelectTrigger>
            <SelectContent>{genreOptions.map(function(g) { return <SelectItem key={g} value={g}>{g}</SelectItem>; })}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sub-genre</Label>
          <Select value={songSpec.subgenre} onValueChange={function(v) { updateSpec('subgenre', v); }} disabled={availableSubgenres.length === 0}>
            <SelectTrigger className="bg-input/50 border-transparent" data-testid="subgenre-select"><SelectValue placeholder="Select sub-genre" /></SelectTrigger>
            <SelectContent>{availableSubgenres.map(function(s) { return <SelectItem key={s} value={s}>{s}</SelectItem>; })}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function MoodControl({ songSpec, updateSpec, customMoodInput, setCustomMoodInput, addCustomMood }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mood / Emotion</Label>
      <Select value={songSpec.mood} onValueChange={function(v) { updateSpec('mood', v); updateSpec('custom_mood', ''); }}>
        <SelectTrigger className="bg-input/50 border-transparent" data-testid="mood-select"><SelectValue placeholder={songSpec.custom_mood || "Select mood"} /></SelectTrigger>
        <SelectContent>{MOODS.map(function(m) { return <SelectItem key={m} value={m}>{m}</SelectItem>; })}</SelectContent>
      </Select>
      <div className="flex gap-2 mt-2">
        <Input placeholder="Or add custom mood..." value={customMoodInput} onChange={function(e) { setCustomMoodInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') addCustomMood(); }} className="bg-input/50 border-transparent focus:border-primary flex-1" data-testid="custom-mood-input" />
        <Button variant="secondary" size="icon" onClick={addCustomMood} data-testid="add-custom-mood-btn"><Plus className="w-4 h-4" /></Button>
      </div>
      {songSpec.custom_mood && <Badge variant="secondary" className="mt-2">Custom: {songSpec.custom_mood}<button onClick={function() { updateSpec('custom_mood', ''); }} className="ml-2"><X className="w-3 h-3" /></button></Badge>}
    </div>
  );
}

function DropdownControls({ songSpec, updateSpec }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Perspective</Label>
        <Select value={songSpec.perspective} onValueChange={function(v) { updateSpec('perspective', v); }}>
          <SelectTrigger className="bg-input/50 border-transparent" data-testid="perspective-select"><SelectValue /></SelectTrigger>
          <SelectContent>{PERSPECTIVES.map(function(p) { return <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Song Structure</Label>
        <StructureBuilder 
          value={songSpec.structure} 
          onChange={function(v) { updateSpec('structure', v); }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rhyme Scheme</Label>
        <Select value={songSpec.rhyme_scheme} onValueChange={function(v) { updateSpec('rhyme_scheme', v); }}>
          <SelectTrigger className="bg-input/50 border-transparent" data-testid="rhyme-scheme-select"><SelectValue /></SelectTrigger>
          <SelectContent>{RHYME_SCHEMES.map(function(r) { return <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SliderControls({ songSpec, updateSpec }) {
  return (
    <div className="space-y-6 pt-4">
      <SliderControl label="Rhyme Variety" leftLabel="Repeat" rightLabel="Vary" value={songSpec.rhyme_variety} onChange={function(v) { updateSpec('rhyme_variety', v[0]); }} testId="rhyme-variety-slider" />
      <SliderControl label="Internal Rhyme Density" leftLabel="None" rightLabel="Heavy" value={songSpec.internal_rhyme_density} onChange={function(v) { updateSpec('internal_rhyme_density', v[0]); }} testId="internal-rhyme-slider" />
      <SliderControl label="Cadence Complexity" leftLabel="Simple" rightLabel="Complex" value={songSpec.cadence_complexity} onChange={function(v) { updateSpec('cadence_complexity', v[0]); }} testId="cadence-slider" />
      <SliderControl label="Word Choice" leftLabel="Plain" rightLabel="Poetic" value={songSpec.word_choice} onChange={function(v) { updateSpec('word_choice', v[0]); }} testId="word-choice-slider" />
      <SliderControl label="Directness" leftLabel="Literal" rightLabel="Abstract" value={songSpec.directness} onChange={function(v) { updateSpec('directness', v[0]); }} testId="directness-slider" />
      <SliderControl label="AI Freedom" leftLabel="Strict" rightLabel="Creative" value={songSpec.ai_freedom} onChange={function(v) { updateSpec('ai_freedom', v[0]); }} testId="ai-freedom-slider" />
    </div>
  );
}

function AdditionalControls({ songSpec, updateSpec, forbiddenWordInput, setForbiddenWordInput, addForbiddenWord, removeForbiddenWord }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        <Label className="text-sm">Encourage imagery progression</Label>
        <Switch checked={songSpec.imagery_progression} onCheckedChange={function(v) { updateSpec('imagery_progression', v); }} data-testid="imagery-switch" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profanity</Label>
        <Select value={songSpec.profanity} onValueChange={function(v) { updateSpec('profanity', v); }}>
          <SelectTrigger className="bg-input/50 border-transparent" data-testid="profanity-select"><SelectValue /></SelectTrigger>
          <SelectContent>{PROFANITY_OPTIONS.map(function(p) { return <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Forbidden Words</Label>
        <div className="flex gap-2">
          <Input placeholder="Add word or phrase..." value={forbiddenWordInput} onChange={function(e) { setForbiddenWordInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') addForbiddenWord(); }} className="bg-input/50 border-transparent focus:border-primary flex-1" data-testid="forbidden-word-input" />
          <Button variant="secondary" size="icon" onClick={addForbiddenWord} data-testid="add-forbidden-btn"><Plus className="w-4 h-4" /></Button>
        </div>
        {songSpec.forbidden_words.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{songSpec.forbidden_words.map(function(word) { return <Badge key={word} variant="outline" className="text-xs">{word}<button onClick={function() { removeForbiddenWord(word); }} className="ml-2"><X className="w-3 h-3" /></button></Badge>; })}</div>}
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Style Inspiration (Optional)</Label>
        <Textarea placeholder="Paste sample lyrics for style reference..." value={songSpec.sample_lyrics} onChange={function(e) { updateSpec('sample_lyrics', e.target.value); }} className="bg-input/50 border-transparent focus:border-primary min-h-[100px] resize-none font-mono text-sm" data-testid="sample-lyrics-input" />
      </div>
    </div>
  );
}
