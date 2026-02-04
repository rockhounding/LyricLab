import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sparkles, RefreshCw, Save, Check, ChevronDown, Loader2, Wand2, FileText, Layers, X, Settings2, MessageSquare, Pencil, Upload, Shuffle } from 'lucide-react';
import { SECTIONS, RHYME_SCHEMES, MOODS } from '@/data/songData';

export function LyricsPanel({
  lyrics,
  setLyrics,
  isGenerating,
  isSaving,
  handleGenerate,
  handleRewrite,
  handleRewriteSection,
  handleSave,
  handleGenerateVariations,
  handleCustomEdit,
  handleTransform,
  variations,
  isGeneratingVariations,
  clearVariations
}) {
  var hasLyrics = lyrics.trim().length > 0;
  var [showVariationsModal, setShowVariationsModal] = useState(false);
  var [showRhymeModal, setShowRhymeModal] = useState(false);
  var [showEditModal, setShowEditModal] = useState(false);
  var [showImportModal, setShowImportModal] = useState(false);
  var [showTransformModal, setShowTransformModal] = useState(false);
  var [rhymeModalMode, setRhymeModalMode] = useState('rewrite');
  var [selectedSection, setSelectedSection] = useState(null);
  var [selectedRhymes, setSelectedRhymes] = useState([]);
  var [editPrompt, setEditPrompt] = useState('');
  var [importText, setImportText] = useState('');

  function openRhymeModal(mode, section) {
    setRhymeModalMode(mode);
    setSelectedSection(section);
    setSelectedRhymes([]);
    setShowRhymeModal(true);
  }

  function openEditModal(section) {
    setSelectedSection(section);
    setEditPrompt('');
    setShowEditModal(true);
  }

  function toggleRhyme(rhyme) {
    if (selectedRhymes.includes(rhyme)) {
      setSelectedRhymes(selectedRhymes.filter(function(r) { return r !== rhyme; }));
    } else {
      setSelectedRhymes([...selectedRhymes, rhyme]);
    }
  }

  function confirmRhymeSelection() {
    var rhymeString = selectedRhymes.length > 0 ? selectedRhymes.join(' + ') : null;
    setShowRhymeModal(false);
    if (rhymeModalMode === 'rewrite') {
      handleRewriteSection(selectedSection, rhymeString);
    } else {
      handleGenerateVariations(selectedSection, rhymeString);
      setShowVariationsModal(true);
    }
  }

  function confirmCustomEdit() {
    if (!editPrompt.trim()) return;
    setShowEditModal(false);
    handleCustomEdit(selectedSection, editPrompt);
  }

  function confirmImport() {
    if (!importText.trim()) return;
    setLyrics(importText);
    setShowImportModal(false);
    setImportText('');
  }

  function quickRewrite(section, rhyme) {
    handleRewriteSection(section, rhyme);
  }

  function quickVariations(section, rhyme) {
    handleGenerateVariations(section, rhyme);
    setShowVariationsModal(true);
  }

  function selectVariation(variationLyrics) {
    setLyrics(variationLyrics);
    setShowVariationsModal(false);
    clearVariations();
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen lg:min-h-0 lg:h-screen">
      <ActionBar
        isGenerating={isGenerating}
        isSaving={isSaving}
        hasLyrics={hasLyrics}
        isGeneratingVariations={isGeneratingVariations}
        handleGenerate={handleGenerate}
        handleRewrite={handleRewrite}
        handleSave={handleSave}
        quickRewrite={quickRewrite}
        quickVariations={quickVariations}
        openRhymeModal={openRhymeModal}
        openEditModal={openEditModal}
        openImportModal={function() { setShowImportModal(true); }}
        openTransformModal={function() { setShowTransformModal(true); }}
      />
      <LyricsEditor 
        lyrics={lyrics} 
        setLyrics={setLyrics} 
        openImportModal={function() { setShowImportModal(true); }}
      />
      
      <VariationsModal
        open={showVariationsModal}
        onOpenChange={setShowVariationsModal}
        variations={variations}
        isLoading={isGeneratingVariations}
        onSelect={selectVariation}
        onClose={function() { setShowVariationsModal(false); clearVariations(); }}
      />

      <RhymeSelectModal
        open={showRhymeModal}
        onOpenChange={setShowRhymeModal}
        mode={rhymeModalMode}
        section={selectedSection}
        selectedRhymes={selectedRhymes}
        toggleRhyme={toggleRhyme}
        onConfirm={confirmRhymeSelection}
      />

      <CustomEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        section={selectedSection}
        prompt={editPrompt}
        setPrompt={setEditPrompt}
        onConfirm={confirmCustomEdit}
        isGenerating={isGenerating}
      />

      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        importText={importText}
        setImportText={setImportText}
        onConfirm={confirmImport}
      />

      <TransformModal
        open={showTransformModal}
        onOpenChange={setShowTransformModal}
        hasLyrics={hasLyrics}
        handleTransform={handleTransform}
        isGenerating={isGenerating}
      />
    </div>
  );
}

function ActionBar({ isGenerating, isSaving, hasLyrics, isGeneratingVariations, handleGenerate, handleRewrite, handleSave, quickRewrite, quickVariations, openRhymeModal, openEditModal, openImportModal, openTransformModal }) {
  return (
    <div className="p-4 md:p-6 border-b border-border/50 bg-card/20 backdrop-blur-sm sticky top-0 lg:top-0 z-30">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleGenerate} disabled={isGenerating || isGeneratingVariations} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 font-semibold" data-testid="generate-btn">
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate
        </Button>

        {/* Import Button */}
        <Button variant="secondary" onClick={openImportModal} className="rounded-full" data-testid="import-btn">
          <Upload className="w-4 h-4 mr-2" />Import
        </Button>

        {/* Transform Button */}
        <Button variant="secondary" disabled={isGenerating || !hasLyrics} onClick={openTransformModal} className="rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border-violet-500/30" data-testid="transform-btn">
          <Shuffle className="w-4 h-4 mr-2" />Transform
        </Button>

        <div className="h-6 w-px bg-border/50 mx-1" />
        
        {/* Edit Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={isGenerating || isGeneratingVariations || !hasLyrics} className="rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30" data-testid="edit-section-btn">
              <Pencil className="w-4 h-4 mr-2" />Edit<ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={function() { openEditModal(null); }}>
              <MessageSquare className="w-4 h-4 mr-2" />Edit Full Song...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {SECTIONS.map(function(section) {
              return (
                <DropdownMenuItem key={section} onClick={function() { openEditModal(section); }}>
                  <Pencil className="w-4 h-4 mr-2" />{section}...
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rewrite Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={isGenerating || isGeneratingVariations || !hasLyrics} className="rounded-full" data-testid="rewrite-section-btn">
              <Wand2 className="w-4 h-4 mr-2" />Rewrite<ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={handleRewrite}>
              <RefreshCw className="w-4 h-4 mr-2" />Rewrite All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {SECTIONS.map(function(section) {
              return (
                <div key={section} className="px-2 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{section}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={function() { quickRewrite(section, null); }}>
                        Go
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-primary" onClick={function() { openRhymeModal('rewrite', section); }}>
                        <Settings2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Variations */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={isGenerating || isGeneratingVariations || !hasLyrics} className="rounded-full bg-accent/20 hover:bg-accent/30 text-accent border-accent/30" data-testid="variations-btn">
              {isGeneratingVariations ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Layers className="w-4 h-4 mr-2" />}
              Variations<ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="px-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center"><Sparkles className="w-3 h-3 mr-1.5" />Full Song</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={function() { quickVariations(null, null); }}>Go</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-accent" onClick={function() { openRhymeModal('variations', null); }}><Settings2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            {SECTIONS.map(function(section) {
              return (
                <div key={section} className="px-2 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{section}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={function() { quickVariations(section, null); }}>Go</Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-accent" onClick={function() { openRhymeModal('variations', section); }}><Settings2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />
        <Button variant="outline" onClick={function() { handleSave('draft'); }} disabled={isSaving || !hasLyrics} className="rounded-full" data-testid="save-draft-btn">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
        <Button onClick={function() { handleSave('done'); }} disabled={isSaving || !hasLyrics} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full" data-testid="done-btn">
          <Check className="w-4 h-4 mr-2" />Done
        </Button>
      </div>
    </div>
  );
}

function ImportModal({ open, onOpenChange, importText, setImportText, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Your Lyrics
          </DialogTitle>
          <DialogDescription>
            Paste your existing lyrics below. You can then use all the editing tools to transform, rewrite, or generate variations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={importText}
            onChange={function(e) { setImportText(e.target.value); }}
            placeholder={"[VERSE 1]\nPaste your lyrics here...\n\n[CHORUS]\nYour chorus goes here...\n\n[VERSE 2]\nSecond verse..."}
            className="min-h-[300px] font-mono text-sm bg-input/50 border-border/50"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Use section headers like [VERSE 1], [CHORUS], [BRIDGE] for best results with editing tools.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={function() { onOpenChange(false); }}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!importText.trim()}>
            <Upload className="w-4 h-4 mr-2" />Import Lyrics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransformModal({ open, onOpenChange, hasLyrics, handleTransform, isGenerating }) {
  var [newTopic, setNewTopic] = useState('');
  var [newMood, setNewMood] = useState('');
  var [newGenre, setNewGenre] = useState('');
  var [keepCadence, setKeepCadence] = useState(true);
  var [keepRhyme, setKeepRhyme] = useState(true);
  var [keepStructure, setKeepStructure] = useState(true);
  var [additionalInstructions, setAdditionalInstructions] = useState('');

  function handleConfirm() {
    handleTransform({
      newTopic: newTopic || null,
      newMood: newMood || null,
      newGenre: newGenre || null,
      keepCadence: keepCadence,
      keepRhyme: keepRhyme,
      keepStructure: keepStructure,
      additionalInstructions: additionalInstructions || null
    });
    onOpenChange(false);
  }

  function reset() {
    setNewTopic('');
    setNewMood('');
    setNewGenre('');
    setKeepCadence(true);
    setKeepRhyme(true);
    setKeepStructure(true);
    setAdditionalInstructions('');
  }

  function applyTemplate(t) {
    if (t.topic) setNewTopic(t.topic);
    if (t.mood) setNewMood(t.mood);
    if (t.genre) setNewGenre(t.genre);
  }

  var templates = [
    { label: 'Love Song', topic: 'Romantic love and deep connection', mood: 'Romantic, heartfelt' },
    { label: 'Party Anthem', mood: 'Energetic, celebratory', genre: 'Dance/Pop' },
    { label: 'Melancholic', mood: 'Sad, introspective, melancholic' },
    { label: 'Empowering', topic: 'Self-confidence and overcoming obstacles', mood: 'Powerful, uplifting' },
    { label: 'Summer Vibes', topic: 'Summer adventures and carefree days', mood: 'Bright, carefree' },
    { label: 'Heartbreak', topic: 'Lost love and moving on', mood: 'Bittersweet, vulnerable' }
  ];

  return (
    <Dialog open={open} onOpenChange={function(v) { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-violet-400" />
            Transform Lyrics
          </DialogTitle>
          <DialogDescription>
            Change the topic, mood, or genre while keeping the same rhythm and flow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Quick Templates */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {templates.map(function(t) {
                return (
                  <button key={t.label} onClick={function() { applyTemplate(t); }} className="px-3 py-1.5 text-xs rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 transition-colors">
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* What to change */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What to Change</Label>
            
            <div className="space-y-2">
              <Label className="text-sm">New Topic/Subject</Label>
              <Input
                value={newTopic}
                onChange={function(e) { setNewTopic(e.target.value); }}
                placeholder="e.g., Summer road trip, Heartbreak, Space exploration..."
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">New Mood/Emotion</Label>
              <Input
                value={newMood}
                onChange={function(e) { setNewMood(e.target.value); }}
                placeholder="e.g., Upbeat, Melancholic, Angry, Hopeful..."
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">New Genre/Style</Label>
              <Input
                value={newGenre}
                onChange={function(e) { setNewGenre(e.target.value); }}
                placeholder="e.g., Country, Hip-hop, 80s synth-pop..."
                className="bg-input/50"
              />
            </div>
          </div>

          {/* What to preserve */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What to Preserve</Label>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-input/30">
              <div>
                <Label className="text-sm">Keep Cadence & Rhythm</Label>
                <p className="text-xs text-muted-foreground">Same syllables per line, same flow</p>
              </div>
              <Switch checked={keepCadence} onCheckedChange={setKeepCadence} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-input/30">
              <div>
                <Label className="text-sm">Keep Rhyme Scheme</Label>
                <p className="text-xs text-muted-foreground">Rhymes in same positions</p>
              </div>
              <Switch checked={keepRhyme} onCheckedChange={setKeepRhyme} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-input/30">
              <div>
                <Label className="text-sm">Keep Structure</Label>
                <p className="text-xs text-muted-foreground">Same sections, same line counts</p>
              </div>
              <Switch checked={keepStructure} onCheckedChange={setKeepStructure} />
            </div>
          </div>

          {/* Additional instructions */}
          <div className="space-y-2">
            <Label className="text-sm">Additional Instructions (optional)</Label>
            <Textarea
              value={additionalInstructions}
              onChange={function(e) { setAdditionalInstructions(e.target.value); }}
              placeholder="Any other specific changes you want..."
              className="min-h-[60px] bg-input/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={function() { onOpenChange(false); }}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isGenerating || !hasLyrics || (!newTopic && !newMood && !newGenre && !additionalInstructions)}
            className="bg-violet-500 hover:bg-violet-600 text-white"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shuffle className="w-4 h-4 mr-2" />}
            Transform
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomEditModal({ open, onOpenChange, section, prompt, setPrompt, onConfirm, isGenerating }) {
  var title = section ? 'Edit ' + section : 'Edit Full Song';
  var placeholder = section 
    ? 'e.g., "Make it shorter", "Add more energy", "Change the metaphor"...'
    : 'e.g., "Make the whole song more upbeat", "Shorten all verses"...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Tell the AI what you want to change.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={prompt}
            onChange={function(e) { setPrompt(e.target.value); }}
            placeholder={placeholder}
            className="min-h-[100px] bg-input/50 border-border/50 focus:border-emerald-500/50"
            autoFocus
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <SuggestionChip onClick={function() { setPrompt('Make it shorter'); }}>Shorter</SuggestionChip>
            <SuggestionChip onClick={function() { setPrompt('Make it longer with more detail'); }}>Longer</SuggestionChip>
            <SuggestionChip onClick={function() { setPrompt('More emotional'); }}>Emotional</SuggestionChip>
            <SuggestionChip onClick={function() { setPrompt('Simpler words'); }}>Simpler</SuggestionChip>
            <SuggestionChip onClick={function() { setPrompt('More poetic'); }}>Poetic</SuggestionChip>
            <SuggestionChip onClick={function() { setPrompt('Punchier'); }}>Punchier</SuggestionChip>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={function() { onOpenChange(false); }}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!prompt.trim() || isGenerating} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuggestionChip({ children, onClick }) {
  return (
    <button onClick={onClick} className="px-2 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </button>
  );
}

function RhymeSelectModal({ open, onOpenChange, mode, section, selectedRhymes, toggleRhyme, onConfirm }) {
  var title = mode === 'rewrite' ? 'Rewrite ' : 'Variations for ';
  title += section || 'Full Song';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>Select rhyme schemes to blend.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {RHYME_SCHEMES.map(function(scheme) {
            var isSelected = selectedRhymes.includes(scheme.value);
            return (
              <div key={scheme.value} className={'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ' + (isSelected ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border')} onClick={function() { toggleRhyme(scheme.value); }}>
                <Checkbox checked={isSelected} />
                <div className="flex-1">
                  <Label className="text-sm font-medium cursor-pointer">{scheme.label}</Label>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={function() { onOpenChange(false); }}>Cancel</Button>
          <Button onClick={onConfirm} className={mode === 'variations' ? 'bg-accent hover:bg-accent/90' : ''}>
            {mode === 'rewrite' ? 'Rewrite' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LyricsEditor({ lyrics, setLyrics, openImportModal }) {
  if (lyrics) {
    return (
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <Textarea
            value={lyrics}
            onChange={function(e) { setLyrics(e.target.value); }}
            placeholder="Your lyrics will appear here..."
            className="w-full min-h-[600px] bg-transparent border-none focus:ring-0 resize-none lyrics-editor text-lg leading-loose p-0"
            data-testid="lyrics-editor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="w-10 h-10 text-primary/50" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold font-['Outfit'] text-muted-foreground">Ready to create?</h3>
            <p className="text-muted-foreground/70 max-w-sm mx-auto">Generate new lyrics or import your own to edit and transform.</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={openImportModal} variant="outline" className="rounded-full">
              <Upload className="w-4 h-4 mr-2" />Import My Lyrics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariationsModal({ open, onOpenChange, variations, isLoading, onSelect, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            Choose a Variation
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-muted-foreground">Generating variations...</p>
            </div>
          ) : variations && variations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variations.map(function(variation, index) {
                return (
                  <div key={variation.index} onClick={function() { onSelect(variation.lyrics); }} className="group p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/50 cursor-pointer transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Option {index + 1}</span>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-accent">Use</Button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/80 line-clamp-12">{variation.lyrics}</pre>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No variations generated</div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4 mr-2" />Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
