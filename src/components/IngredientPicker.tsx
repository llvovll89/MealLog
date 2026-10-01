import { useId } from 'react';
import type { IngredientTag } from '../types';
import { ingredientGroups } from '../data/ingredients';

const IngredientPicker=({value,onChange}:{value:IngredientTag[];onChange:(value:IngredientTag[])=>void})=>{
  const id=useId();
  return <div className="space-y-4">{ingredientGroups.map(group=><fieldset key={group.label}>
    <legend className="field-label">{group.label}</legend>
    <div className="flex flex-wrap gap-2">{group.options.map(option=>{
      const checked=value.includes(option.value);
      return <label key={option.value} htmlFor={`${id}-${option.value}`} className={`preference-choice ${checked?'is-selected':''}`}>
        <input id={`${id}-${option.value}`} type="checkbox" className="sr-only" checked={checked} onChange={()=>onChange(checked?value.filter(tag=>tag!==option.value):[...value,option.value])}/>
        <span>{option.label}</span><span className="preference-check" aria-hidden="true">{checked?'✓':'+'}</span>
      </label>;
    })}</div>
  </fieldset>)}</div>;
};
export default IngredientPicker;
