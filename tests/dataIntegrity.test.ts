import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, parseDate, dateKeyAgo, isDateKey } from '../src/utils/dates';
import { getMealRecords, saveMealRecord, saveCustomMenu, deleteCustomMenu, updateMealRecord } from '../src/utils/storage';
import { calculateInsightMetrics } from '../src/hooks/useInsightMetrics';
import { getRecommendedMenusWithMeta } from '../src/utils/recommendationEngine';

beforeEach(()=>localStorage.clear());
describe('local dates and record integrity',()=>{
  it('keeps midnight records on their local calendar date and rejects invalid dates',()=>{
    expect(formatDate(new Date(2026,9,1,0,30))).toBe('2026-10-01');
    expect(formatDate(parseDate('2026-10-01'))).toBe('2026-10-01');
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2024-02-29')).toBe(true);
  });
  it('pins nutrition on legacy records before deleting a custom menu',()=>{
    saveCustomMenu({id:'menu',name:'집밥',category:'한식',calories:430});
    localStorage.setItem('mealog_meal_records',JSON.stringify([{id:'old',date:formatDate(new Date()),mealType:'lunch',menu:'집밥',timestamp:Date.now()}]));
    deleteCustomMenu('menu');
    expect(getMealRecords()[0]).toMatchObject({calories:430,category:'한식'});
  });
  it('keeps unknown calories distinct from known zero and allows editing without changing record identity',()=>{
    saveMealRecord({id:'unknown',date:formatDate(new Date()),mealType:'lunch',menu:'내가 만든 식사',timestamp:Date.now()});
    expect(getMealRecords()[0].calories).toBeNull();
    updateMealRecord('unknown',{calories:0,date:dateKeyAgo(1),category:'한식'});
    expect(getMealRecords()[0]).toMatchObject({id:'unknown',calories:0,date:dateKeyAgo(1),category:'한식'});
    expect(()=>saveMealRecord(getMealRecords()[0])).toThrow('이미 저장된 기록');
  });
  it('counts unknown-calorie meals as recorded days, excluding incomplete days from calorie averages',()=>{
    const records=[
      {id:'today',date:dateKeyAgo(0),mealType:'lunch' as const,menu:'집밥',timestamp:Date.now(),calories:null},
      {id:'yesterday',date:dateKeyAgo(1),mealType:'dinner' as const,menu:'밥',timestamp:Date.now(),calories:500},
      {id:'zero',date:dateKeyAgo(2),mealType:'breakfast' as const,menu:'차',timestamp:Date.now(),calories:0},
    ];
    const metrics=calculateInsightMetrics(records,500);
    expect(metrics).toMatchObject({recentActiveDays:3,streakDays:3,weeklyKnownDays:2,weeklyUnknownMeals:1,weeklyAvgCalories:250,weeklyGoalHitRate:50});
  });
});
describe('recommendation diversity',()=>{
  it('offers fresh unique candidates on reroll and handles exhaustion',()=>{
    const first=getRecommendedMenusWithMeta('lunch',5,'한식',{random:()=>0});
    const second=getRecommendedMenusWithMeta('lunch',5,'한식',{excludeNames:first.map(item=>item.name),random:()=>0});
    expect(second.length).toBeGreaterThan(0);
    expect(second.every(item=>!first.some(previous=>previous.name===item.name))).toBe(true);
    expect(new Set(second.map(item=>item.name)).size).toBe(second.length);
    const all=getRecommendedMenusWithMeta('lunch',1000,'한식');
    expect(getRecommendedMenusWithMeta('lunch',10,'한식',{excludeNames:all.map(item=>item.name)})).toEqual([]);
  });
  it('does not treat a historical meal entered today as a recent meal',()=>{
    const baseline=getRecommendedMenusWithMeta('dinner',1000,undefined,{random:()=>0}).find(item=>item.name==='김치찌개')!;
    saveMealRecord({id:'past',date:dateKeyAgo(50),mealType:'dinner',menu:'김치찌개',timestamp:Date.now()});
    const updated=getRecommendedMenusWithMeta('dinner',1000,undefined,{random:()=>0}).find(item=>item.name==='김치찌개')!;
    expect(updated.menuFrequency14d).toBe(0);
    expect(updated.diversityScore).toBe(baseline.diversityScore);
  });
  it('can choose different high-ranking candidates with different random draws',()=>{
    const first=getRecommendedMenusWithMeta('lunch',3,undefined,{random:()=>0});
    const second=getRecommendedMenusWithMeta('lunch',3,undefined,{random:()=>.999});
    expect(first.map(item=>item.name)).not.toEqual(second.map(item=>item.name));
  });
});
// Restore accidental fake timer state if another suite ran on this worker.
vi.useRealTimers();
