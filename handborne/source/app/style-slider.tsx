'use client';
import { Field } from '@base-ui/react/field';
import { Slider } from '@/components/ui/slider';
import { STYLES } from './catalog';

export function StyleSlider({label,value,onChange,className}:{label:string;value:number;onChange:(value:number)=>void;className?:string}) {
  return <Field.Root>
    <Field.Label className="sr-only">{label} — {STYLES[value].name}</Field.Label>
    <Slider min={1} max={STYLES.length} step={1} largeStep={5} value={[value+1]} onValueChange={v=>onChange(Number(Array.isArray(v)?v[0]:v)-1)} className={className} />
  </Field.Root>;
}
