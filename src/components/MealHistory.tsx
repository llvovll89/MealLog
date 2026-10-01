import { useEffect, useMemo, useRef, useState } from 'react';
import type { MealRecord, MealType } from '../types';
import { getMealRecords, deleteMealRecord, getProfile, saveMealRecord, updateMealRecord, storageErrorMessage } from '../utils/storage';
import { getMealTypeLabel, getAllMenuItems } from '../utils/recommendationEngine';
import { formatDateDisplay, isDateKey } from '../utils/dates';
import { mealCalories, summarizeDay } from '../utils/mealNutrition';
import { getImage, deleteImage } from '../utils/imageStorage';
import { useMealRecords } from '../hooks/useStorageRevision';
import { useToast } from '../hooks/useToast';

interface EditDraft { id:string; date:string; mealType:MealType; menu:string; calories:string; category:string }
const inputClass='w-full px-3 py-2.5 bg-white border border-app-border rounded-xl';
const MealHistory = ({onSettingsClick}:{onSettingsClick?:()=>void}) => {
  const toast=useToast();
  const savedRecords=useMealRecords();
  const records=useMemo(()=>[...savedRecords].sort((a,b)=>b.date.localeCompare(a.date)||b.timestamp-a.timestamp),[savedRecords]);
  const goal=getProfile()?.calorieGoal;
  const [date,setDate]=useState('');
  const [search,setSearch]=useState('');
  const [images,setImages]=useState<Record<string,string>>({});
  const [draft,setDraft]=useState<EditDraft|null>(null);
  const [deleted,setDeleted]=useState<MealRecord|null>(null);
  const deletedRef=useRef<MealRecord|null>(null);
  const deleteTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    let cancelled=false;
    void Promise.all(records.filter(record=>record.imageUrl?.startsWith('idb:')).map(async record=>[record.id,await getImage(record.imageUrl!.slice(4))] as const))
      .then(entries=>{if(!cancelled)setImages(Object.fromEntries(entries.filter((entry):entry is readonly [string,string]=>entry[1]!==null)));})
      .catch(()=>{/* Keep text records accessible when a photo cannot be loaded. */});
    return()=>{cancelled=true;};
  },[records]);
  const purgePhoto=(record:MealRecord|null)=>{
    if(record?.imageUrl?.startsWith('idb:') && !getMealRecords().some(item=>item.imageUrl===record.imageUrl)) void deleteImage(record.imageUrl.slice(4)).catch(()=>{});
  };
  useEffect(()=>()=>{if(deleteTimer.current)clearTimeout(deleteTimer.current);purgePhoto(deletedRef.current);},[]);
  const remove=(record:MealRecord)=>{
    try {
      deleteMealRecord(record.id);
      if(deleteTimer.current)clearTimeout(deleteTimer.current);
      purgePhoto(deletedRef.current);
      deletedRef.current=record;setDeleted(record);
      deleteTimer.current=setTimeout(()=>{purgePhoto(record);deletedRef.current=null;setDeleted(null);},10000);
      if(draft?.id===record.id)setDraft(null);
    } catch(error){toast.error(storageErrorMessage(error));}
  };
  const undo=()=>{
    if(!deletedRef.current)return;
    try {
      saveMealRecord(deletedRef.current);
      if(deleteTimer.current)clearTimeout(deleteTimer.current);
      deletedRef.current=null;setDeleted(null);toast.success('삭제한 기록을 복원했습니다.');
    }catch(error){toast.error(storageErrorMessage(error));}
  };
  const edit=(record:MealRecord)=>setDraft({id:record.id,date:record.date,mealType:record.mealType,menu:record.menu,calories:record.calories?.toString()??'',category:record.category??'기타'});
  const save=(event:React.FormEvent)=>{
    event.preventDefault();if(!draft)return;
    const calories=draft.calories.trim()?Number(draft.calories):null;
    if(!isDateKey(draft.date)||!draft.menu.trim()||(calories!==null&&(!Number.isFinite(calories)||calories<0||calories>100000))){toast.warning('날짜, 메뉴와 칼로리를 확인해주세요.');return;}
    try{updateMealRecord(draft.id,{date:draft.date,mealType:draft.mealType,menu:draft.menu.trim(),calories,category:draft.category});setDraft(null);toast.success('기록을 수정했습니다.');}catch(error){toast.error(storageErrorMessage(error));}
  };
  const filtered=records.filter(record=>(!date||record.date===date)&&record.menu.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const grouped=filtered.reduce((acc,record)=>{(acc[record.date]??=[]).push(record);return acc;},{} as Record<string,MealRecord[]>);
  return <div className="page-content">
    <div className="page-heading"><h2>식사 히스토리</h2><p className="text-apple-secondary">지난 식사를 찾아보고, 잘못 입력한 기록을 수정할 수 있어요.</p></div>
    <div className="content-surface space-y-5">
      {deleted&&<div role="status" className="undo-banner"><span>{deleted.menu} 기록을 삭제했습니다.</span><button type="button" onClick={undo} className="font-semibold underline whitespace-nowrap">삭제 취소</button></div>}
      <div className="grid min-[520px]:grid-cols-2 gap-3">
        <div><label htmlFor="history-date" className="field-label">날짜로 찾기</label><input id="history-date" type="date" value={date} onChange={event=>setDate(event.target.value)} className={inputClass}/></div>
        <div><label htmlFor="history-search" className="field-label">메뉴로 찾기</label><input id="history-search" type="search" placeholder="메뉴 이름 검색" value={search} onChange={event=>setSearch(event.target.value)} className={inputClass}/></div>
      </div>
      {(date||search)&&<button type="button" onClick={()=>{setDate('');setSearch('');}} className="choice-button">전체 기록 보기</button>}
      {!goal&&onSettingsClick&&<button onClick={onSettingsClick} className="text-sm text-app-primary underline">하루 칼로리 목표 설정하기</button>}
      {!filtered.length&&<div className="py-10 text-center text-apple-secondary"><p>{records.length?'조건에 맞는 기록이 없어요.':'아직 기록된 식사가 없습니다.'}</p><p className="text-sm mt-2">{records.length?'날짜나 검색어를 바꿔보세요.':'식사 기록 탭에서 첫 식사를 남겨보세요.'}</p></div>}
      {Object.entries(grouped).map(([key,dayRecords])=>{
        const dailyRecords=records.filter(record=>record.date===key);
        const summary=summarizeDay(dailyRecords);
        return <section key={key} className="bg-app-tint rounded-2xl p-4 space-y-3">
          <div><h3 className="text-base font-semibold">{formatDateDisplay(key)}</h3><p className="text-sm text-apple-secondary mt-1">하루 전체 {dailyRecords.length}회 기록 · {summary.unknownCount?`입력된 칼로리 ${summary.calories} kcal · 미입력 ${summary.unknownCount}건`:`총 ${summary.calories} kcal`}</p>
            {goal&&summary.complete&&<div className="mt-2"><p className="text-xs text-apple-secondary mb-1">하루 목표 {goal} kcal</p><div className="h-2 rounded-full bg-white overflow-hidden"><div className={`h-full ${summary.calories>goal?'bg-red-500':'bg-app-primary'}`} style={{width:`${Math.min(summary.calories/goal*100,100)}%`}}/></div></div>}
          </div>
          {dayRecords.map(record=>{
            const photo=record.imageUrl?.startsWith('idb:')?images[record.id]:record.imageUrl;
            return <article key={record.id} className="bg-white rounded-2xl p-4">
              {draft?.id===record.id?<form onSubmit={save} className="space-y-3">
                <label className="field-label">날짜<input type="date" required value={draft.date} onChange={event=>setDraft({...draft,date:event.target.value})} className={inputClass}/></label>
                <label className="field-label">식사 시간<select value={draft.mealType} onChange={event=>setDraft({...draft,mealType:event.target.value as MealType})} className={inputClass}>{(['breakfast','lunch','dinner'] as MealType[]).map(type=><option key={type} value={type}>{getMealTypeLabel(type)}</option>)}</select></label>
                <label className="field-label">메뉴<input required maxLength={200} value={draft.menu} onChange={event=>{const menu=getAllMenuItems().find(item=>item.name===event.target.value);setDraft({...draft,menu:event.target.value,calories:menu?.calories?.toString()??'',category:menu?.category??'기타'});}} className={inputClass}/></label>
                <div className="grid grid-cols-2 gap-3"><label className="field-label">칼로리 (선택)<input type="number" min="0" max="100000" step="any" placeholder="미입력" value={draft.calories} onChange={event=>setDraft({...draft,calories:event.target.value})} className={inputClass}/></label><label className="field-label">분류<select value={draft.category} onChange={event=>setDraft({...draft,category:event.target.value})} className={inputClass}>{['한식','중식','일식','양식','분식','기타'].map(value=><option key={value}>{value}</option>)}</select></label></div>
                <div className="flex gap-2"><button type="submit" className="btn-primary px-4 py-3">수정 저장</button><button type="button" onClick={()=>setDraft(null)} className="choice-button">취소</button></div>
              </form>:<>
                {photo&&<img src={photo} alt={record.menu} className="w-full h-40 object-cover rounded-xl mb-3"/>}
                <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold break-words">{record.menu}</p><p className="text-sm text-apple-secondary">{getMealTypeLabel(record.mealType)} · {mealCalories(record)===null?'칼로리 미입력':`${mealCalories(record)} kcal`}</p></div><div className="flex gap-1"><button type="button" onClick={()=>edit(record)} aria-label={`${record.menu} 기록 수정`} className="record-action">수정</button><button type="button" onClick={()=>remove(record)} aria-label={`${record.menu} 기록 삭제`} className="record-action text-red-600">삭제</button></div></div>
              </>}
            </article>;
          })}
        </section>;
      })}
    </div>
  </div>;
};
export default MealHistory;
