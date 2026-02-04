import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, X, LayoutTemplate } from 'lucide-react';

const SECTION_TYPES = [
  { id: 'intro', label: 'Intro', short: 'INT', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'verse', label: 'Verse', short: 'V', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'pre-chorus', label: 'Pre-Chorus', short: 'PC', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'chorus', label: 'Chorus', short: 'C', color: 'bg-primary/20 text-primary border-primary/30' },
  { id: 'post-chorus', label: 'Post-Chorus', short: 'PO', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'bridge', label: 'Bridge', short: 'BR', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'instrumental', label: 'Instrumental', short: 'INS', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'breakdown', label: 'Breakdown', short: 'BD', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'hook', label: 'Hook', short: 'H', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { id: 'outro', label: 'Outro', short: 'OUT', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

const TEMPLATES = {
  'pop': {
    name: 'Pop',
    structure: ['intro', 'verse', 'pre-chorus', 'chorus', 'verse', 'pre-chorus', 'chorus', 'bridge', 'chorus', 'outro']
  },
  'pop-simple': {
    name: 'Pop (Simple)',
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus']
  },
  'rap': {
    name: 'Hip-Hop/Rap',
    structure: ['intro', 'verse', 'hook', 'verse', 'hook', 'verse', 'hook', 'outro']
  },
  'trap': {
    name: 'Trap',
    structure: ['intro', 'hook', 'verse', 'hook', 'verse', 'hook', 'breakdown', 'hook', 'outro']
  },
  'ballad': {
    name: 'Ballad',
    structure: ['intro', 'verse', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro']
  },
  'rock': {
    name: 'Rock',
    structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'instrumental', 'bridge', 'chorus', 'chorus', 'outro']
  },
  'edm': {
    name: 'EDM/Electronic',
    structure: ['intro', 'breakdown', 'chorus', 'verse', 'breakdown', 'chorus', 'bridge', 'chorus', 'outro']
  },
  'rnb': {
    name: 'R&B',
    structure: ['intro', 'verse', 'pre-chorus', 'chorus', 'verse', 'pre-chorus', 'chorus', 'bridge', 'chorus', 'outro']
  },
  'verse-hook': {
    name: 'Verse-Hook',
    structure: ['verse', 'hook', 'verse', 'hook']
  },
  'aaba': {
    name: 'AABA (Jazz)',
    structure: ['verse', 'verse', 'bridge', 'verse']
  }
};

export function StructureBuilder({ value, onChange }) {
  var [structure, setStructure] = useState(function() {
    if (value && typeof value === 'string' && value.includes('/')) {
      return value.split('/').map(function(s) {
        var lower = s.toLowerCase().trim().replace(' ', '-');
        var found = SECTION_TYPES.find(function(t) { return t.id === lower || t.label.toLowerCase() === s.toLowerCase().trim(); });
        return found ? found.id : 'verse';
      });
    }
    if (Array.isArray(value)) return value;
    return ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'];
  });
  var [draggedIndex, setDraggedIndex] = useState(null);
  var [dragOverIndex, setDragOverIndex] = useState(null);

  function updateStructure(newStructure) {
    setStructure(newStructure);
    var structureString = newStructure.map(function(id) {
      var section = SECTION_TYPES.find(function(s) { return s.id === id; });
      return section ? section.label : id;
    }).join('/');
    onChange(structureString);
  }

  function addSection(sectionId) {
    updateStructure([...structure, sectionId]);
  }

  function removeSection(index) {
    updateStructure(structure.filter(function(_, i) { return i !== index; }));
  }

  function applyTemplate(templateId) {
    if (TEMPLATES[templateId]) {
      updateStructure([...TEMPLATES[templateId].structure]);
    }
  }

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    var newStructure = [...structure];
    var draggedItem = newStructure[draggedIndex];
    newStructure.splice(draggedIndex, 1);
    newStructure.splice(dropIndex, 0, draggedItem);
    updateStructure(newStructure);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function getSectionInfo(sectionId) {
    return SECTION_TYPES.find(function(s) { return s.id === sectionId; }) || { id: sectionId, label: sectionId, short: '?', color: 'bg-muted text-muted-foreground border-border' };
  }

  return (
    <div className="space-y-2">
      {/* Template selector */}
      <div className="flex items-center gap-2">
        <Select onValueChange={applyTemplate}>
          <SelectTrigger className="h-8 text-xs bg-input/50 border-transparent flex-1">
            <LayoutTemplate className="w-3 h-3 mr-1.5 opacity-50" />
            <SelectValue placeholder="Load template..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATES).map(function([id, template]) {
              return <SelectItem key={id} value={id} className="text-xs">{template.name}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Section palette - compact grid */}
      <div className="grid grid-cols-5 gap-1">
        {SECTION_TYPES.map(function(section) {
          return (
            <button
              key={section.id}
              onClick={function() { addSection(section.id); }}
              className={'px-1.5 py-1 text-[10px] font-medium rounded border transition-all hover:scale-105 truncate ' + section.color}
              title={'Add ' + section.label}
            >
              {section.short}
            </button>
          );
        })}
      </div>

      {/* Structure builder - vertical list */}
      <div className="min-h-[100px] max-h-[200px] overflow-y-auto p-2 rounded-lg bg-input/30 border border-dashed border-border/50 scrollbar-hide">
        {structure.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/50 text-center py-6">Click sections above or load a template</p>
        ) : (
          <div className="flex flex-col gap-1">
            {structure.map(function(sectionId, index) {
              var section = getSectionInfo(sectionId);
              var isDragging = draggedIndex === index;
              var isDragOver = dragOverIndex === index;
              
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={function(e) { handleDragStart(e, index); }}
                  onDragOver={function(e) { handleDragOver(e, index); }}
                  onDragLeave={function() { setDragOverIndex(null); }}
                  onDrop={function(e) { handleDrop(e, index); }}
                  onDragEnd={handleDragEnd}
                  className={
                    'group flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded border cursor-grab active:cursor-grabbing transition-all ' +
                    section.color +
                    (isDragging ? ' opacity-50 scale-95' : '') +
                    (isDragOver ? ' ring-1 ring-primary ring-offset-1 ring-offset-background' : '')
                  }
                >
                  <span className="text-[9px] text-muted-foreground/50 w-3">{index + 1}</span>
                  <GripVertical className="w-3 h-3 opacity-30 group-hover:opacity-70 shrink-0" />
                  <span className="flex-1 truncate">{section.label}</span>
                  <button
                    onClick={function(e) { e.stopPropagation(); removeSection(index); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span>{structure.length} sections</span>
        <span>Drag to reorder</span>
      </div>
    </div>
  );
}
