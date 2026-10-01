import { useEffect, useRef, useState } from 'react';
import MealPlate from './MealPlate';
import MenuPreferencePicker from './MenuPreferencePicker';
import IngredientPicker from './IngredientPicker';
import { ingredientLabel } from '../data/ingredients';
import { matchesDietaryRestrictions } from '../utils/dietaryFilter';
import type { MealType, MenuCategory, MenuPreference, IngredientTag } from '../types';
import { preferenceLabel } from '../data/menuPreferences';
import { getCurrentMealType, getMealTypeLabel, getRecommendedMenusWithMeta, getAllMenuItems, type RecommendationMeta } from '../utils/recommendationEngine';
import { formatDate } from '../utils/dates';
import { getMealRecords, saveMealRecord, storageErrorMessage, getDietaryRestrictions, saveDietaryRestrictions } from '../utils/storage';
import { useStorageRevision } from '../hooks/useStorageRevision';
import { useToast } from '../hooks/useToast';

const categories: (MenuCategory|'전체')[]=['전체','한식','중식','일식','양식','분식','기타'];
const MealRecommendation=()=>{
  const toast=useToast();useStorageRevision();
  const [mealType,setMealType]=useState<MealType>(getCurrentMealType);
  const [category,setCategory]=useState<MenuCategory|'전체'>('전체');
  const [count,setCount]=useState(3);
  const [preferences,setPreferences]=useState<MenuPreference[]>([]);
  const restrictions=getDietaryRestrictions();
  const changeRestrictions=(excludedIngredients:IngredientTag[])=>{
    try{saveDietaryRestrictions({excludedIngredients});reset();}
    catch(error){toast.error(storageErrorMessage(error));}
  };
  const [recommendations,setRecommendations]=useState<RecommendationMeta[]>([]);
  const [selectedName,setSelectedName]=useState('');
  const [loading,setLoading]=useState(false);
  const [showResults,setShowResults]=useState(false);
  const [exhausted,setExhausted]=useState(false);
  const seenNames=useRef<string[]>([]);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const resultsRef=useRef<HTMLElement>(null);
  const optionsRef=useRef<HTMLFieldSetElement>(null);
  const loadingRef=useRef(false);
  const [saving,setSaving]=useState(false);
  const savingRef=useRef(false);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  useEffect(()=>{
    if(!loading)return;
    resultsRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  },[loading]);
  const reset=()=>{seenNames.current=[];setRecommendations([]);setSelectedName('');setShowResults(false);setExhausted(false);};
  const recommend=(restart=false)=>{
    if(loadingRef.current)return;
    if(restart)seenNames.current=[];
    loadingRef.current=true;setLoading(true);setShowResults(true);setExhausted(false);
    timer.current=setTimeout(()=>{
      try{
        const results=getRecommendedMenusWithMeta(mealType,count,category==='전체'?undefined:category,{excludeNames:seenNames.current,preferences});
        setRecommendations(results);setSelectedName(results[0]?.name??'');
        setExhausted(results.length===0);
        seenNames.current.push(...results.map(item=>item.name));
      }catch(error){toast.error(storageErrorMessage(error));setRecommendations([]);}
      finally{loadingRef.current=false;setLoading(false);}
    },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:250);
  };
  const allowedRecommendations=recommendations.filter(item=>{const menu=getAllMenuItems().find(menu=>menu.name===item.name);return menu&&matchesDietaryRestrictions(menu,restrictions);});
  const chosen=allowedRecommendations.find(item=>item.name===selectedName)??allowedRecommendations[0];
  const details=chosen?getAllMenuItems().find(item=>item.name===chosen.name):null;
  const alreadyRecorded=!!chosen&&getMealRecords().some(record=>record.date===formatDate(new Date())&&record.mealType===mealType&&record.menu===chosen.name);
  const save=()=>{
    if(!chosen||!details||savingRef.current||alreadyRecorded)return;
    const currentDetails=getAllMenuItems().find(menu=>menu.name===chosen.name);
    if(!currentDetails||!matchesDietaryRestrictions(currentDetails,getDietaryRestrictions())){toast.warning('제외 조건이나 재료 정보가 바뀌었어요. 다시 추천받아주세요.');return;}
    savingRef.current=true;setSaving(true);
    try{
      saveMealRecord({id:crypto.randomUUID(),date:formatDate(new Date()),mealType,menu:chosen.name,calories:details.calories,category:details.category,timestamp:Date.now()});
      toast.success(`${chosen.name}를 ${getMealTypeLabel(mealType)}로 기록했습니다.`);
    }catch(error){toast.error(storageErrorMessage(error));}
    finally{savingRef.current=false;setSaving(false);}
  };
  const todayRecords=getMealRecords().filter(record=>record.date===formatDate(new Date()));
  return <div className="page-content">
    <div className="recommendation-hero"><div><h2>오늘은<br/>뭐 먹을까요?</h2><p>나의 식사 기록을 바탕으로<br/>먹기 좋은 메뉴를 골라드려요.</p></div><MealPlate/></div>
    <div className="today-summary" role="group" aria-label="오늘의 식사 기록">{(['breakfast','lunch','dinner'] as MealType[]).map(type=>{
      const meals=todayRecords.filter(record=>record.mealType===type);
      return <div key={type}><span className="text-xs text-apple-secondary">{getMealTypeLabel(type)}</span><p className="text-sm font-semibold mt-1 break-words">{meals.length?meals.map(record=>record.menu).join(', '):'아직 기록 전'}</p></div>;
    })}</div>
    <fieldset ref={optionsRef} disabled={loading} className="recommendation-options space-y-5">
      <div><h3 className="text-lg font-bold">오늘 끌리는 메뉴는?</h3><p className="text-sm text-apple-secondary mt-1">시간대와 취향을 고르면, 메뉴 고민은 MealLog가 할게요.</p></div>
      <div><span className="field-label">언제 먹을까요?</span><div className="flex gap-2">{(['breakfast','lunch','dinner'] as MealType[]).map(type=><button key={type} type="button" aria-pressed={mealType===type} onClick={()=>{setMealType(type);reset();}} className={`choice-button flex-1 ${mealType===type?'is-selected':''}`}>{getMealTypeLabel(type)}</button>)}</div></div>
      <div className="preference-section space-y-3">
        <div><h4 className="font-semibold">지금 당기는 맛과 재료</h4><p className="text-sm text-apple-secondary mt-1">여러 개 선택하면 모두 맞는 메뉴를 찾아요. 선택하지 않아도 괜찮아요.</p></div>
        <MenuPreferencePicker compact value={preferences} onChange={value=>{setPreferences(value);reset();}}/>
        {preferences.length>0&&<button type="button" onClick={()=>{setPreferences([]);reset();}} className="text-sm text-app-text underline underline-offset-4 py-2">취향 선택 해제</button>}
        <p className="text-xs text-apple-secondary">메뉴의 일반적인 특징을 기준으로 추천해요. 맛과 재료는 조리법에 따라 달라질 수 있어요.</p>
      </div>
      <details className="restriction-section" open={restrictions.needsReview?true:undefined}>
        <summary className="cursor-pointer font-semibold py-3">알레르기·못 먹는 재료 <span className="text-sm font-normal">{restrictions.excludedIngredients.length?`${restrictions.excludedIngredients.length}개 제외 중`:'선택하기'}</span></summary>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-apple-secondary">선택한 재료가 들어가거나 들어갈 수 있는 메뉴는 먼저 제외해요. 재료 정보가 없는 메뉴도 추천하지 않아요. 이 설정은 다음 방문에도 유지됩니다.</p>
          {restrictions.needsReview&&<p role="alert" className="text-sm font-semibold">저장된 제외 설정을 읽지 못해 추천을 중단했어요. 제외할 재료를 다시 선택해주세요.</p>}
          {restrictions.needsReview&&<button type="button" onClick={()=>changeRestrictions([])} className="choice-button">제외할 재료가 없습니다</button>}
          <IngredientPicker value={restrictions.excludedIngredients} onChange={changeRestrictions}/>
          <p className="text-xs text-apple-secondary">일반적인 재료 정보로 걸러주는 기능이에요. 알레르기가 있다면 먹기 전 소스·육수·교차 접촉 여부를 매장에 확인해주세요. 목록에 없는 알레르기는 별도로 확인해야 합니다.</p>
          {restrictions.excludedIngredients.length>0&&<button type="button" onClick={()=>changeRestrictions([])} className="text-sm underline py-2">제외 재료 선택 해제</button>}
        </div>
      </details>
      {restrictions.excludedIngredients.length>0&&<p className="text-sm font-semibold break-words">제외 중: {restrictions.excludedIngredients.map(ingredientLabel).join(', ')}</p>}
      <div><span className="field-label">메뉴 분류</span><div className="category-options">{categories.map(value=><button key={value} type="button" aria-pressed={category===value} onClick={()=>{setCategory(value);reset();}} className={`category-chip ${category===value?'is-selected':''}`}>{value}</button>)}</div></div>
      <div><span className="field-label">추천 개수</span><div className="flex gap-2">{[3,5,7,10].map(value=><button key={value} type="button" aria-pressed={count===value} onClick={()=>{setCount(value);reset();}} className={`choice-button flex-1 ${count===value?'is-selected':''}`}>{value}개</button>)}</div></div>
      <button type="button" onClick={()=>recommend()} disabled={loading} className="btn-primary w-full py-3.5">{loading?'메뉴 고르는 중…':recommendations.length?'다른 메뉴 추천 받기':'추천 받기'}</button>
    </fieldset>
    {showResults&&<section ref={resultsRef} className="recommendation-results scroll-mt-6" aria-label="추천 결과" aria-busy={loading}>
      <h3 className="text-xl font-semibold mb-4">{loading?'지금 먹기 좋은 메뉴를 고르고 있어요':'추천 결과'}</h3>
      {preferences.length>0&&<p className="text-sm text-apple-secondary mb-4">선택한 취향: {preferences.map(preferenceLabel).join(' + ')}</p>}
      {!loading&&chosen&&restrictions.excludedIngredients.length>0&&<p className="text-sm text-apple-secondary mb-4">제외 재료와 포함 가능 재료를 대조했어요. 아래 메뉴도 실제 주문 전 재료 확인이 필요합니다.</p>}
      {loading?<div role="status" className="content-surface min-h-64"><p className="text-apple-secondary">식사 기록과 메뉴 분류를 확인하고 있어요.</p></div>:chosen&&details?<>
        {allowedRecommendations.length<count&&<p className="text-sm text-apple-secondary mb-4">이 조건에서 아직 보지 않은 메뉴 {allowedRecommendations.length}개를 찾았어요.</p>}
        <div className="menu-result bg-app-primary text-white">
          <p className="text-sm mb-2">{getMealTypeLabel(mealType)} 추천 메뉴</p><h4 className="text-3xl font-bold break-words">{chosen.name}</h4>
          <p className="mt-3 text-sm">{details.category} · {details.calories===null?'칼로리 미입력':`${details.calories} kcal (추정)`}</p>
          <div className="flex flex-wrap gap-2 mt-4">{chosen.reasons.map(reason=><span key={reason} className="text-sm bg-black/10 px-3 py-1 rounded-full">{reason}</span>)}</div>
          <details key={chosen.name} className="mt-5"><summary className="cursor-pointer text-sm font-semibold py-2">추천 이유 자세히 보기</summary>
            <div className="bg-white text-app-text rounded-2xl p-4 mt-2 space-y-3"><p className="text-sm text-apple-secondary">최근 14일 {chosen.menuFrequency14d}회 먹은 메뉴예요. 같은 분류는 최근 30일 {chosen.categoryFrequency30d}회 기록했어요.</p>
              {details.ingredientInfo?.complete?<><p className="text-sm">일반적인 포함 재료: {details.ingredientInfo.contains.map(ingredientLabel).join(', ')||'등록된 재료 없음'}</p>{details.ingredientInfo.mayContain.length>0&&<p className="text-sm">들어갈 수 있는 재료: {details.ingredientInfo.mayContain.map(ingredientLabel).join(', ')}</p>}</>:<p className="text-sm">재료 정보가 없거나 입력을 완료하지 않은 메뉴예요.</p>}
              {[
                ['메뉴 분류 다양성',chosen.preferenceScore],['칼로리 적합도',chosen.calorieFitScore],['최근 메뉴 다양성',chosen.diversityScore],['시간대 적합도',chosen.timeFitScore],
              ].map(([label,value])=><div key={String(label)}><div className="flex justify-between gap-2 text-sm mb-1"><span>{label}</span><span>{Math.round(Number(value)*100)}점</span></div><div className="h-1.5 bg-app-tint rounded-full overflow-hidden"><div className="h-full bg-app-primary" style={{width:`${Number(value)*100}%`}}/></div></div>)}
            </div>
          </details>
          <button type="button" onClick={save} disabled={saving||alreadyRecorded} className="w-full bg-white text-app-text rounded-2xl py-3.5 mt-5 font-semibold disabled:opacity-75">{alreadyRecorded?'오늘 이 식사로 기록했어요':saving?'저장 중…':'이 메뉴로 기록하기'}</button>
        </div>
        <div className="space-y-3 mt-4">{allowedRecommendations.filter(item=>item.name!==chosen.name).map(item=>{
          const menu=getAllMenuItems().find(menu=>menu.name===item.name);
          return <button type="button" key={item.name} onClick={()=>setSelectedName(item.name)} className="menu-alternative bg-white w-full text-left"><span className="font-semibold text-lg break-words">{item.name}</span><span className="block text-sm text-apple-secondary mt-1">{menu?.category} · {menu?.calories==null?'칼로리 미입력':`${menu.calories} kcal`}</span><span className="block text-sm mt-2">{item.reasons[0]}</span></button>;
        })}</div>
      </>:<div className="content-surface space-y-4"><p>{restrictions.needsReview?'제외 재료 설정을 다시 확인해주세요.':exhausted&&seenNames.current.length?'이 조건의 메뉴를 모두 살펴봤어요.':restrictions.excludedIngredients.length?'제외 조건을 유지하면서 취향에 맞는 메뉴를 찾지 못했어요. 재료 정보가 없는 메뉴도 제외했어요. 알레르기 제외는 유지하고 취향이나 메뉴 분류를 바꿔보세요.':preferences.length?'선택한 취향을 모두 만족하는 메뉴가 없어요. 취향을 하나 줄이거나 메뉴 분류를 바꿔보세요.':'조건에 맞는 메뉴가 없어요. 분류나 시간대를 바꿔보세요.'}</p>
        <button type="button" onClick={()=>{optionsRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});optionsRef.current?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true});}} className="choice-button">추천 조건 다시 고르기</button>
        {seenNames.current.length>0&&<button type="button" onClick={()=>recommend(true)} className="btn-primary px-4 py-3">전체 후보에서 다시 추천 받기</button>}</div>}
    </section>}
  </div>;
};
export default MealRecommendation;
