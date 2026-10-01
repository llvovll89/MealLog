import { beforeEach, describe, expect, it } from 'vitest';
import type { DietaryRestrictions, MenuItem, MenuPreference } from '../src/types';
import { ingredientOptions } from '../src/data/ingredients';
import { menuDatabase } from '../src/data/menuDatabase';
import { matchesDietaryRestrictions } from '../src/utils/dietaryFilter';
import { getAllMenuItems, getRecommendedMenusWithMeta } from '../src/utils/recommendationEngine';
import { getDietaryRestrictions, saveCustomMenu, saveDietaryRestrictions, STORAGE_KEYS } from '../src/utils/storage';

beforeEach(()=>localStorage.clear());
const dish:MenuItem={name:'집밥',category:'한식',calories:400,preferences:['meat'],ingredientInfo:{contains:['beef'],mayContain:['soy','wheat'],complete:true}};
const recommend=(preferences:MenuPreference[]=[])=>getRecommendedMenusWithMeta('lunch',100,undefined,{preferences,random:()=>0});
describe('hard dietary exclusions',()=>{
  it('excludes both direct ingredients and possible sauce or stock ingredients',()=>{
    expect(matchesDietaryRestrictions(dish,{excludedIngredients:['beef']})).toBe(false);
    expect(matchesDietaryRestrictions(dish,{excludedIngredients:['soy']})).toBe(false);
    expect(matchesDietaryRestrictions(dish,{excludedIngredients:['milk']})).toBe(true);
  });
  it('excludes unknown or malformed ingredient information only when restrictions are active',()=>{
    const unknown={...dish,ingredientInfo:undefined};
    expect(matchesDietaryRestrictions(unknown,{excludedIngredients:['egg']})).toBe(false);
    expect(matchesDietaryRestrictions(unknown,{excludedIngredients:[]})).toBe(true);
    expect(matchesDietaryRestrictions({...dish,ingredientInfo:{contains:['unrecognized'],mayContain:[]} as unknown as MenuItem['ingredientInfo']},{excludedIngredients:['egg']})).toBe(false);
  });
  it('keeps a partially entered recipe excluded until ingredient entry is explicitly confirmed',()=>{
    expect(matchesDietaryRestrictions({...dish,ingredientInfo:{contains:[],mayContain:[],complete:false}},{excludedIngredients:['milk']})).toBe(false);
    expect(matchesDietaryRestrictions({...dish,ingredientInfo:{contains:[],mayContain:[],complete:true}},{excludedIngredients:['milk']})).toBe(true);
  });
  it('keeps every candidate free of selected ingredient tags before weighting scores',()=>{
    saveDietaryRestrictions({excludedIngredients:['pork']});
    const results=recommend(['meat']);
    expect(results.length).toBeGreaterThan(0);
    expect(results.map(menu=>menu.name)).not.toContain('제육볶음');
    expect(results.map(menu=>menu.name)).not.toContain('삼겹살');
    expect(results.every(menu=>matchesDietaryRestrictions(getAllMenuItems().find(item=>item.name===menu.name)!,getDietaryRestrictions()))).toBe(true);
  });
  it('does not let an explicit empty option bypass the saved restrictions',()=>{
    saveDietaryRestrictions({excludedIngredients:['pork']});
    const results=getRecommendedMenusWithMeta('lunch',100,undefined,{restrictions:{excludedIngredients:[]},random:()=>0});
    expect(results.every(menu=>!menu.name.includes('제육')&&matchesDietaryRestrictions(getAllMenuItems().find(item=>item.name===menu.name)!,getDietaryRestrictions()))).toBe(true);
  });
  it('never falls back to forbidden or unknown menus when all candidates are excluded',()=>{
    saveDietaryRestrictions({excludedIngredients:ingredientOptions.map(option=>option.value)});
    expect(recommend()).toEqual([]);
    expect(recommend(['meat'])).toEqual([]);
  });
  it('applies exclusions when rerolling and leaves restrictions intact when exhausted',()=>{
    saveDietaryRestrictions({excludedIngredients:['pork']});
    const first=getRecommendedMenusWithMeta('lunch',3,undefined,{random:()=>0});
    const next=getRecommendedMenusWithMeta('lunch',100,undefined,{excludeNames:first.map(menu=>menu.name),random:()=>0});
    expect(next.every(menu=>!first.some(previous=>previous.name===menu.name))).toBe(true);
    expect(next.every(menu=>matchesDietaryRestrictions(getAllMenuItems().find(item=>item.name===menu.name)!,getDietaryRestrictions()))).toBe(true);
    expect(getRecommendedMenusWithMeta('lunch',100,undefined,{excludeNames:[...first,...next].map(menu=>menu.name)})).toEqual([]);
    expect(getDietaryRestrictions().excludedIngredients).toEqual(['pork']);
  });
  it('excludes legacy custom menus with unknown ingredients and evaluates explicitly entered recipes',()=>{
    saveCustomMenu({id:'unknown',name:'기존 집밥',category:'한식',preferences:['meat']});
    saveCustomMenu({id:'known',name:'우리집 소고기',category:'한식',preferences:['meat'],ingredientInfo:dish.ingredientInfo});
    saveDietaryRestrictions({excludedIngredients:['milk']});
    expect(recommend(['meat']).map(menu=>menu.name)).toContain('우리집 소고기');
    expect(recommend(['meat']).map(menu=>menu.name)).not.toContain('기존 집밥');
    saveDietaryRestrictions({excludedIngredients:['soy']});
    expect(recommend(['meat']).map(menu=>menu.name)).not.toContain('우리집 소고기');
  });
  it('stops recommendations when saved restrictions cannot be read, until the user reviews them',()=>{
    localStorage.setItem(STORAGE_KEYS.RESTRICTIONS,'{broken');
    expect(getDietaryRestrictions().needsReview).toBe(true);expect(recommend()).toEqual([]);
    saveDietaryRestrictions({excludedIngredients:['milk']});
    expect(getDietaryRestrictions()).toEqual({excludedIngredients:['milk']});
    expect(recommend().length).toBeGreaterThan(0);
  });
  it('rejects unsupported restriction values rather than dropping them',()=>{
    const invalid={excludedIngredients:['unknown']} as unknown as DietaryRestrictions;
    expect(()=>saveDietaryRestrictions(invalid)).toThrow('제외 재료');
    expect(getRecommendedMenusWithMeta('lunch',3,undefined,{restrictions:invalid})).toEqual([]);
  });
  it('supports the added cooking and format preferences while retaining all selected constraints',()=>{
    const results=recommend(['soup','noodle','mild']);
    expect(results.map(menu=>menu.name)).toContain('우동');
    expect(results.every(menu=>['soup','noodle','mild'].every(tag=>getAllMenuItems().find(item=>item.name===menu.name)?.preferences?.includes(tag as MenuPreference)))).toBe(true);
    expect(menuDatabase.every(menu=>!menu.preferences?.includes('spicy')||!menu.preferences.includes('mild'))).toBe(true);
  });
});
