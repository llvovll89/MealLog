import { createElement, useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import MenuIngredientEditor from '../src/components/MenuIngredientEditor';
import type { MenuIngredientInfo } from '../src/types';
import { matchesDietaryRestrictions } from '../src/utils/dietaryFilter';

afterEach(cleanup);
it('requires explicit completion and invalidates it whenever recipe ingredients are changed',()=>{
  const changed=vi.fn<(value:MenuIngredientInfo|undefined)=>void>();
  const Harness=()=>{
    const [value,setValue]=useState<MenuIngredientInfo|undefined>();
    return createElement(MenuIngredientEditor,{value,onChange:next=>{changed(next);setValue(next);}});
  };
  render(createElement(Harness));
  const allowed=()=>matchesDietaryRestrictions({name:'집밥',category:'한식',calories:300,ingredientInfo:changed.mock.lastCall?.[0]},{excludedIngredients:['milk']});
  fireEvent.click(screen.getByLabelText('이 메뉴의 재료 정보를 입력할게요'));
  expect(allowed()).toBe(false);
  const confirmation=screen.getByLabelText('포함 재료·양념·육수와 포함 가능 재료를 모두 확인했습니다') as HTMLInputElement;
  fireEvent.click(confirmation);
  expect(allowed()).toBe(true);
  const includedSummary=screen.getByText(/^포함 재료 \(/);
  fireEvent.click(includedSummary);
  fireEvent.click(within(includedSummary.closest('details')!).getByRole('checkbox',{name:'대두·콩'}));
  expect(confirmation.checked).toBe(false);
  expect(allowed()).toBe(false);
  fireEvent.click(confirmation);
  expect(allowed()).toBe(true);
  expect(changed.mock.lastCall?.[0]?.contains).toEqual(['soy']);
});
