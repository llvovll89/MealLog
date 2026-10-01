import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import MealHistory from '../src/components/MealHistory';
import { ToastProvider } from '../src/context/ToastContext';
import { getMealRecords, notifyStorageChanged, saveMealRecord } from '../src/utils/storage';
import { deleteImage } from '../src/utils/imageStorage';
vi.mock('../src/utils/imageStorage', () => ({ getImage: async () => 'data:image/png;base64,aGVsbG8=', deleteImage: vi.fn(async () => {}) }));
const original = { id:'meal', date:'2026-10-01', mealType:'lunch' as const, menu:'테스트 식사', timestamp:1, calories:null, category:'기타', imageUrl:'idb:photo' };
beforeEach(() => { localStorage.clear(); notifyStorageChanged(); vi.clearAllMocks(); saveMealRecord(original); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const mount = () => render(createElement(ToastProvider, null, createElement(MealHistory)));
describe('record editing and undo', () => {
  it('edits a record while retaining its identity, photo and original timestamp', async () => {
    mount();
    fireEvent.click(screen.getByRole('button',{name:'테스트 식사 기록 수정'}));
    fireEvent.change(screen.getByLabelText('메뉴'),{target:{value:'수정한 식사'}});
    fireEvent.change(screen.getByLabelText('칼로리 (선택)'),{target:{value:'0'}});
    fireEvent.click(screen.getByRole('button',{name:'수정 저장'}));
    expect(getMealRecords()[0]).toMatchObject({...original,menu:'수정한 식사',calories:0});
    expect(screen.getByText('점심 · 0 kcal')).toBeDefined();
  });
  it('restores the deleted record and preserves its photo when undo is pressed', () => {
    vi.useFakeTimers(); mount();
    fireEvent.click(screen.getByRole('button',{name:'테스트 식사 기록 삭제'}));
    expect(getMealRecords()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button',{name:'삭제 취소'}));
    act(() => { vi.advanceTimersByTime(10001); });
    expect(getMealRecords()).toEqual([original]);
    expect(deleteImage).not.toHaveBeenCalled();
  });
  it('removes an unreferenced photo only after the undo window expires', () => {
    vi.useFakeTimers(); mount();
    fireEvent.click(screen.getByRole('button',{name:'테스트 식사 기록 삭제'}));
    act(() => { vi.advanceTimersByTime(9999); });
    expect(deleteImage).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(deleteImage).toHaveBeenCalledWith('photo');
  });
});
