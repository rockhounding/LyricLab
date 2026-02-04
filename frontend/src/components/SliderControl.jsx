import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export const SliderControl = ({ label, leftLabel, rightLabel, value, onChange, testId }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={onChange}
      max={100}
      step={1}
      className="[&_[role=slider]]:bg-primary"
      data-testid={testId}
    />
    <div className="flex justify-between text-xs text-muted-foreground/70">
      <span>{leftLabel}</span>
      <span>{rightLabel}</span>
    </div>
  </div>
);

export default SliderControl;
