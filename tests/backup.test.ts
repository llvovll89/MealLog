import { beforeEach, describe, expect, it, vi } from 'vitest';
const images=vi.hoisted(()=>new Map<string,string>());
vi.mock('../src/utils/imageStorage',()=>({
  getAllImages:async()=>[...images].map(([id,dataUrl])=>({id,dataUrl})),
  replaceImages:async(data:{id:string;dataUrl:string}[])=>{images.clear();data.forEach(image=>images.set(image.id,image.dataUrl));},
}));
import { clearAllData, exportAllData, importAllData, validateBackup } from '../src/utils/backup';
import { getMealRecords, saveMealRecord, getProfile, saveProfile } from '../src/utils/storage';
import { formatDate } from '../src/utils/dates';
import * as imageStorage from '../src/utils/imageStorage';
import { getCustomMenus, getDietaryRestrictions, saveCustomMenu, saveDietaryRestrictions } from '../src/utils/storage';
const photo='data:image/png;base64,aGVsbG8=';
const backup=()=>({version:2,exportedAt:new Date().toISOString(),profile:null,mealRecords:[],weightRecords:[],customMenus:[],favorites:[]});
beforeEach(()=>{localStorage.clear();images.clear();});
describe('portable backups',()=>{
  it('round-trips custom ingredient information and saved exclusions',async()=>{
    saveDietaryRestrictions({excludedIngredients:['milk','shrimp']});
    saveCustomMenu({id:'recipe',name:'집밥',category:'한식',preferences:['soup','mild'],ingredientInfo:{contains:['beef'],mayContain:['soy','wheat'],complete:true}});
    const exported=await exportAllData();
    await clearAllData();await importAllData(exported,'replace');
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['milk','shrimp']);
    expect(getCustomMenus()[0]).toMatchObject({preferences:['soup','mild'],ingredientInfo:{contains:['beef'],mayContain:['soy','wheat'],complete:true}});
  });
  it('unions exclusions during merge and preserves them when a legacy backup lacks this setting',async()=>{
    saveDietaryRestrictions({excludedIngredients:['milk']});
    await importAllData({...backup(),restrictions:{excludedIngredients:['shrimp']}},'merge');
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['milk','shrimp']);
    await importAllData(backup(),'replace');
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['milk','shrimp']);
    await importAllData({...backup(),restrictions:{excludedIngredients:['egg']}},'replace');
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['egg']);
  });
  it('rejects invalid ingredient data or restrictions before touching existing exclusions',async()=>{
    saveDietaryRestrictions({excludedIngredients:['milk']});
    await expect(importAllData({...backup(),restrictions:{excludedIngredients:['unsupported']}},'replace')).rejects.toThrow('백업 파일');
    await expect(importAllData({...backup(),customMenus:[{id:'bad',name:'메뉴',category:'한식',ingredientInfo:{contains:['soy'],mayContain:['unsupported'],complete:true}}]},'replace')).rejects.toThrow('백업 파일');
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['milk']);
  });
  it('blocks concurrent writes during restore and releases the lock afterward',async()=>{
    let release!: () => void;
    let entered!: () => void;
    const paused = new Promise<void>(resolve => { release = resolve; });
    const started = new Promise<void>(resolve => { entered = resolve; });
    vi.spyOn(imageStorage,'replaceImages').mockImplementationOnce(async()=>{entered();await paused;});
    const restoring=importAllData(backup(),'replace');
    await started;
    expect(()=>saveProfile({height:170,weight:65})).toThrow('진행 중');
    release();await restoring;
    expect(()=>saveProfile({height:170,weight:65})).not.toThrow();
  });
  it('exports actual photo bytes and restores them after a complete reset',async()=>{
    images.set('image',photo);
    saveMealRecord({id:'meal',date:formatDate(new Date()),mealType:'lunch',menu:'김치찌개',timestamp:Date.now(),imageUrl:'idb:image'});
    const exported=await exportAllData();
    expect(exported.mealRecords[0].imageUrl).toBe(photo);
    await clearAllData();
    expect(images.size).toBe(0);
    expect(getMealRecords()).toEqual([]);
    await importAllData(exported,'replace');
    const restored=getMealRecords()[0];
    expect(restored.menu).toBe('김치찌개');
    expect(images.get(restored.imageUrl!.slice(4))).toBe(photo);
  });
  it('rejects malformed data before changing any storage or photos',async()=>{
    saveProfile({height:170,weight:65});images.set('keep',photo);
    const malformed={...backup(),mealRecords:[{id:'bad',date:'2026-02-30',mealType:'lunch',menu:'식사',timestamp:0}]};
    await expect(importAllData(malformed,'replace')).rejects.toThrow('백업 파일');
    expect(getProfile()).toMatchObject({height:170,weight:65});expect(images.get('keep')).toBe(photo);
    expect(()=>validateBackup({...backup(),version:999})).toThrow();
  });
  it('merges without overwriting same-ID records and keeps the existing profile',async()=>{
    saveProfile({height:170,weight:65});
    saveMealRecord({id:'same',date:formatDate(new Date()),mealType:'lunch',menu:'현재 식사',timestamp:1,calories:300});
    const imported={...backup(),profile:{height:180,weight:80},mealRecords:[
      {id:'same',date:formatDate(new Date()),mealType:'lunch',menu:'이전 식사',timestamp:1,calories:200},
      {id:'new',date:formatDate(new Date()),mealType:'dinner',menu:'새 식사',timestamp:2,calories:null},
    ]};
    await importAllData(imported,'merge');
    expect(getMealRecords()).toHaveLength(2);expect(getMealRecords().find(item=>item.id==='same')?.menu).toBe('현재 식사');
    expect(getProfile()?.height).toBe(170);
    await importAllData(imported,'merge');expect(getMealRecords()).toHaveLength(2);
  });
  it('rolls back local data and images when writing the restored records fails',async()=>{
    saveProfile({height:170,weight:65});images.set('before',photo);
    const original=Storage.prototype.setItem;
    let failed=false;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(key,value){
      if(key==='mealog_meal_records'&&!failed){failed=true;throw new DOMException('Full','QuotaExceededError');}
      return original.call(this,key,value);
    });
    await expect(importAllData({...backup(),profile:{height:180,weight:80}},'replace')).rejects.toThrow();
    expect(getProfile()?.height).toBe(170);expect(images.get('before')).toBe(photo);
  });
  it('clears images and MealLog preferences without removing unrelated site storage',async()=>{
    images.set('photo',photo);localStorage.setItem('mealog_notifications',JSON.stringify({enabled:false}));
    localStorage.setItem('mealog_favorites','["밥"]');localStorage.setItem('unrelated','keep');
    await clearAllData();
    expect(images.size).toBe(0);expect(localStorage.getItem('mealog_notifications')).toBeNull();expect(localStorage.getItem('mealog_favorites')).toBeNull();expect(localStorage.getItem('unrelated')).toBe('keep');
  });
  it('accepts legacy exports and reports photo references that cannot be restored',async()=>{
    const legacy={profile:null,mealRecords:[{id:'old',date:formatDate(new Date()),mealType:'dinner',menu:'김치찌개',timestamp:0,imageUrl:'idb:missing'}],weightRecords:[],customMenus:[]};
    const result=await importAllData(legacy,'replace');
    expect(result.missingPhotos).toBe(1);expect(getMealRecords()[0].imageUrl).toBeUndefined();expect(getMealRecords()[0].calories).toBe(450);
  });
});
