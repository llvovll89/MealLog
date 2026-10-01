import { beforeEach, describe, expect, it } from 'vitest';
import { getAllMenuItems, getRecommendedMenusWithMeta } from '../src/utils/recommendationEngine';
import { saveCustomMenu, updateCustomMenuPreferences } from '../src/utils/storage';
import { validateBackup } from '../src/utils/backup';
import type { MenuPreference } from '../src/types';

beforeEach(()=>localStorage.clear());
const recommend=(preferences:MenuPreference[], category?:string, excludeNames:string[]=[])=>getRecommendedMenusWithMeta('lunch',100,category,{preferences,excludeNames,random:()=>0});
const tagsFor=(name:string)=>getAllMenuItems().find(menu=>menu.name===name)?.preferences??[];
describe('taste and ingredient recommendations',()=>{
  it('only recommends menus with the selected taste and includes it in the reason',()=>{
    const results=recommend(['spicy']);
    expect(results.length).toBeGreaterThan(3);
    expect(results.every(menu=>tagsFor(menu.name).includes('spicy'))).toBe(true);
    expect(results.every(menu=>menu.reasons[0].includes('매콤한 맛'))).toBe(true);
  });
  it('requires every selected taste and ingredient, rather than any one of them',()=>{
    const results=recommend(['spicy','savory','meat']);
    expect(results.map(menu=>menu.name)).toContain('제육볶음');
    expect(results.map(menu=>menu.name)).not.toContain('떡볶이');
    expect(results.map(menu=>menu.name)).not.toContain('불고기');
    expect(results.every(menu=>['spicy','savory','meat'].every(tag=>tagsFor(menu.name).includes(tag as MenuPreference)))).toBe(true);
  });
  it('respects the category and returns no unrelated substitutes for an empty combination',()=>{
    const seafood=recommend(['seafood'],'중식');
    expect(seafood.length).toBeGreaterThan(0);
    expect(seafood.every(menu=>getAllMenuItems().find(item=>item.name===menu.name)?.category==='중식')).toBe(true);
    expect(recommend(['spicy'],'양식')).toEqual([]);
  });
  it('keeps the same preference constraint when rerolling and excludes previous results',()=>{
    const first=getRecommendedMenusWithMeta('lunch',3,undefined,{preferences:['spicy','meat'],random:()=>0});
    const next=recommend(['spicy','meat'],undefined,first.map(menu=>menu.name));
    expect(next.length).toBeGreaterThan(0);
    expect(next.every(menu=>!first.some(previous=>previous.name===menu.name))).toBe(true);
    expect(next.every(menu=>tagsFor(menu.name).includes('spicy')&&tagsFor(menu.name).includes('meat'))).toBe(true);
  });
  it('keeps existing recommendations when no preferences are selected',()=>{
    expect(recommend([])).toEqual(getRecommendedMenusWithMeta('lunch',100,undefined,{random:()=>0}));
  });
  it('uses explicitly assigned custom tags, updates them, and never guesses from a name',()=>{
    saveCustomMenu({id:'unknown',name:'매운 고기 집밥',category:'한식'});
    saveCustomMenu({id:'tagged',name:'우리집 볶음',category:'한식',preferences:['spicy','meat']});
    expect(recommend(['spicy','meat']).map(menu=>menu.name)).toContain('우리집 볶음');
    expect(recommend(['spicy','meat']).map(menu=>menu.name)).not.toContain('매운 고기 집밥');
    updateCustomMenuPreferences('unknown',['spicy','meat']);
    expect(recommend(['spicy','meat']).map(menu=>menu.name)).toContain('매운 고기 집밥');
    updateCustomMenuPreferences('unknown',[]);
    expect(recommend(['spicy','meat']).map(menu=>menu.name)).not.toContain('매운 고기 집밥');
  });
  it('preserves tags in validated backups and rejects unknown tag values',()=>{
    const data={version:2,profile:null,mealRecords:[],weightRecords:[],customMenus:[{id:'menu',name:'집밥',category:'한식',preferences:['spicy','meat','spicy']}]};
    expect(validateBackup(data).customMenus[0].preferences).toEqual(['spicy','meat']);
    expect(()=>validateBackup({...data,customMenus:[{...data.customMenus[0],preferences:['arbitrary']}]})).toThrow('백업 파일');
  });
});
