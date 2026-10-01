import { useId } from 'react';
import type { MenuPreference } from '../types';
import { preferenceGroups } from '../data/menuPreferences';

const MenuPreferencePicker = ({value, onChange, compact=false}: {value: MenuPreference[]; onChange: (value: MenuPreference[]) => void; compact?:boolean}) => {
  const id = useId();
  const renderGroup=(group:typeof preferenceGroups[number])=><fieldset key={group.label}>
      <legend className="field-label">{group.label}</legend>
      <div className="flex flex-wrap gap-2">
        {group.options.map(option => {
          const selected = value.includes(option.value);
          return <label key={option.value} htmlFor={`${id}-${option.value}`} className={`preference-choice ${selected?'is-selected':''}`}>
            <input id={`${id}-${option.value}`} type="checkbox" checked={selected} onChange={() => onChange(selected ? value.filter(item=>item!==option.value) : [...value,option.value])} className="sr-only"/>
            <span aria-hidden="true">{option.icon}</span><span>{option.label}</span><span className="preference-check" aria-hidden="true">{selected?'✓':'+'}</span>
          </label>;
        })}
      </div>
    </fieldset>;
  const extraCount=preferenceGroups.slice(2).flatMap(group=>group.options).filter(option=>value.includes(option.value)).length;
  return <div className="space-y-3">
    {(compact?preferenceGroups.slice(0,2):preferenceGroups).map(renderGroup)}
    {compact&&<details><summary className="font-semibold text-sm cursor-pointer py-2">조리·식감·메뉴 형태 더 고르기 {extraCount>0&&`(${extraCount}개)`}</summary><div className="space-y-3 pt-3">{preferenceGroups.slice(2).map(renderGroup)}</div></details>}
  </div>;
};
export default MenuPreferencePicker;
