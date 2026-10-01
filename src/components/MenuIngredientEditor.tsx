import type { MenuIngredientInfo } from '../types';
import IngredientPicker from './IngredientPicker';

const MenuIngredientEditor=({value,onChange}:{value:MenuIngredientInfo|undefined;onChange:(value:MenuIngredientInfo|undefined)=>void})=><div className="space-y-3">
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-[#3974a6]" checked={value!==undefined} onChange={event=>onChange(event.target.checked?{contains:[],mayContain:[],complete:false}:undefined)}/><span>이 메뉴의 재료 정보를 입력할게요</span></label>
  {value&&<>
    <p className="text-sm text-apple-secondary">주재료뿐 아니라 양념·소스·육수에 쓰는 재료도 선택해주세요.</p>
    <details><summary className="cursor-pointer font-semibold py-2">포함 재료 ({value.contains.length}개)</summary><div className="py-2"><IngredientPicker value={value.contains} onChange={contains=>onChange({...value,contains,complete:false})}/></div></details>
    <details><summary className="cursor-pointer font-semibold py-2">추가되거나 들어갈 수 있는 재료 ({value.mayContain.length}개)</summary><div className="py-2"><IngredientPicker value={value.mayContain} onChange={mayContain=>onChange({...value,mayContain,complete:false})}/></div></details>
    <p className="text-xs text-apple-secondary">빈 목록은 위 목록의 재료를 쓰지 않는다는 뜻이에요. 입력 정보로 제외 조건을 계산하며, 알레르기 안전을 보장하지는 않습니다.</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-[#3974a6]" checked={value.complete} onChange={event=>onChange({...value,complete:event.target.checked})}/><span>포함 재료·양념·육수와 포함 가능 재료를 모두 확인했습니다</span></label>
    {!value.complete&&<p className="text-xs font-semibold">확인을 마칠 때까지 제외 조건이 있는 추천에서는 빠져요. 재료를 수정하면 다시 확인해야 해요.</p>}
  </>}
  {!value&&<p className="text-xs text-apple-secondary">재료 정보를 입력하지 않으면 제외 조건을 적용한 추천에서 빠져요.</p>}
</div>;
export default MenuIngredientEditor;
