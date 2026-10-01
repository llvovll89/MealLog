import { useRef, useState } from 'react';
import type { MealType, MenuItem } from '../types';
import { getFavorites, getMealRecords, saveMealRecord, storageErrorMessage, toggleFavorite } from '../utils/storage';
import { getCurrentMealType, getMealTypeLabel, getAllMenuItems } from '../utils/recommendationEngine';
import { formatDate, isDateKey } from '../utils/dates';
import { deleteImage, saveImage } from '../utils/imageStorage';
import { useToast } from '../hooks/useToast';
import { useStorageRevision } from '../hooks/useStorageRevision';

const inputClass = 'w-full px-4 py-2.5 border border-app-border bg-white rounded-xl focus:outline-none text-base';
const categories = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];
const MealLogger = () => {
  const toast = useToast();
  useStorageRevision();
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [mealType, setMealType] = useState<MealType>(getCurrentMealType);
  const [category, setCategory] = useState('전체');
  const [search, setSearch] = useState('');
  const [listMode, setListMode] = useState<'all' | 'recent' | 'favorites'>('all');
  const [menu, setMenu] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<MenuItem | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const favoriteNames = getFavorites();
  const recentMenus = [...new Map(getMealRecords().sort((a,b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp)
    .map(record => [record.menu, {name:record.menu, category:record.category ?? '기타', calories:record.calories ?? null}])).values()];
  const allMenus = [...new Map([...recentMenus, ...getAllMenuItems()].map(item => [item.name,item])).values()];
  const source = listMode === 'recent' ? recentMenus.slice(0,12) : listMode === 'favorites' ? allMenus.filter(item => favoriteNames.includes(item.name)) : allMenus;
  const filtered = source.filter(item => (category === '전체' || item.category === category) && item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selectMenu = (item: MenuItem) => { setMenu(item.name); setCalories(item.calories?.toString() ?? ''); setSelectedDetails(item); };
  const favorite = (name: string) => { try { toggleFavorite(name); } catch(error) { toast.error(storageErrorMessage(error)); } };

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value='';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/^image\/(png|jpeg|webp|gif|avif|heic|heif|bmp)$/.test(file.type)) { toast.warning('5MB 이하의 사진 파일을 선택해주세요.'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.onerror = () => toast.error('사진을 읽지 못했습니다. 다시 선택해주세요.');
    reader.readAsDataURL(file);
  };
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    if (!menu.trim() || !isDateKey(date)) { toast.warning('메뉴 이름과 날짜를 확인해주세요.'); return; }
    const calorieValue = calories.trim() ? Number(calories) : null;
    if (calorieValue !== null && (!Number.isFinite(calorieValue) || calorieValue < 0 || calorieValue > 100000)) { toast.warning('칼로리는 0 이상의 숫자로 입력해주세요.'); return; }
    savingRef.current=true; setSaving(true);
    const id=crypto.randomUUID(); let imageSaved=false;
    try {
      if (imageData) { await saveImage(id,imageData); imageSaved=true; }
      saveMealRecord({id,date,mealType,menu:menu.trim(),calories:calorieValue,category:selectedDetails?.category ?? (category === '전체' ? '기타' : category),timestamp:Date.now(),imageUrl:imageSaved ? `idb:${id}` : undefined});
      toast.success(`${menu.trim()}를 ${getMealTypeLabel(mealType)}로 기록했습니다.`);
      setMenu(''); setCalories(''); setSelectedDetails(null); setImageData(null);
    } catch(error) {
      if (imageSaved) { try { await deleteImage(id); } catch { /* A failed photo cleanup never hides the save error. */ } }
      toast.error(storageErrorMessage(error));
    } finally { savingRef.current=false; setSaving(false); }
  };

  return <div className="page-content">
    <div className="page-heading"><h2>식사 기록하기</h2><p className="text-apple-secondary">먹은 메뉴를 찾아 간단히 남겨보세요.</p></div>
    <form onSubmit={handleSave}>
      <fieldset disabled={saving} className="content-surface meal-log-form space-y-4">
        <div><label htmlFor="meal-date" className="field-label">날짜</label><input id="meal-date" type="date" value={date} onChange={event=>setDate(event.target.value)} className={inputClass} required /></div>
        <div><span className="field-label">식사 시간</span><div className="flex gap-2">{(['breakfast','lunch','dinner'] as MealType[]).map(type=><button type="button" key={type} aria-pressed={mealType===type} onClick={()=>setMealType(type)} className={`choice-button flex-1 ${mealType===type?'is-selected':''}`}>{getMealTypeLabel(type)}</button>)}</div></div>
        <div className="space-y-3">
          <label htmlFor="menu-search" className="field-label">메뉴 찾기</label>
          <input id="menu-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="예: 김치찌개, 샐러드" className={inputClass} />
          <div className="flex flex-wrap gap-2">{([['all','전체 메뉴'],['recent','최근 메뉴'],['favorites','즐겨찾기']] as const).map(([value,label])=><button type="button" key={value} aria-pressed={listMode===value} onClick={()=>setListMode(value)} className={`choice-button ${listMode===value?'is-selected':''}`}>{label}</button>)}</div>
          <div className="flex flex-wrap gap-2">{categories.map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)} className={`category-chip ${category===value?'is-selected':''}`}>{value}</button>)}</div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-app-tint rounded-2xl p-2">
            {filtered.map(item=><div key={item.name} className="relative">
              <button type="button" aria-pressed={selectedDetails?.name===item.name} onClick={()=>selectMenu(item)} className={`menu-choice ${selectedDetails?.name===item.name?'is-selected':''}`}>
                <span className="block pr-5 break-words">{item.name}</span><span className="block text-xs mt-1 opacity-80">{item.calories===null?'칼로리 미입력':`${item.calories} kcal`}</span>
              </button>
              <button type="button" aria-label={`${item.name} 즐겨찾기`} aria-pressed={favoriteNames.includes(item.name)} onClick={()=>favorite(item.name)} className={`favorite-button ${selectedDetails?.name===item.name?'text-white':'text-app-primary'}`}>{favoriteNames.includes(item.name)?'★':'☆'}</button>
            </div>)}
            {!filtered.length && <p role="status" className="col-span-2 p-4 text-sm text-apple-secondary">{listMode==='favorites'?'메뉴 옆 별을 눌러 즐겨찾기에 추가해보세요.':'일치하는 메뉴가 없어요. 아래에 직접 입력할 수 있습니다.'}</p>}
          </div>
        </div>
        <div><label htmlFor="meal-menu" className="field-label">먹은 메뉴</label><input id="meal-menu" value={menu} onChange={event=>{setMenu(event.target.value);setSelectedDetails(null);setCalories('');}} placeholder="메뉴를 고르거나 직접 입력하세요" className={inputClass} maxLength={200} required /></div>
        <div><label htmlFor="meal-calories" className="field-label">칼로리 (선택)</label><input id="meal-calories" type="number" min="0" max="100000" step="any" value={calories} onChange={event=>setCalories(event.target.value)} placeholder="모르면 비워두세요" className={inputClass} /><p className="text-xs text-apple-secondary mt-2">메뉴의 기본 값은 추정치예요. 먹은 양에 맞게 수정할 수 있습니다.</p></div>
        <div><span className="field-label">식사 사진 (선택, 최대 5MB)</span>
          {imageData ? <div className="relative"><img src={imageData} alt="식사 미리보기" className="w-full h-48 object-cover rounded-2xl" /><button type="button" onClick={()=>setImageData(null)} className="absolute top-3 right-3 bg-white px-4 py-2 rounded-xl">사진 제거</button></div> :
            <div className="flex gap-3">{(['camera','gallery'] as const).map(source=><label key={source} className="upload-choice"><span aria-hidden="true">{source==='camera'?'📷':'🖼️'}</span>{source==='camera'?'카메라':'갤러리'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif,image/bmp" capture={source==='camera'?'environment':undefined} onChange={handleImage} className="sr-only" /></label>)}</div>}
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">{saving?'저장 중…':'기록하기'}</button>
      </fieldset>
    </form>
  </div>;
};
export default MealLogger;
