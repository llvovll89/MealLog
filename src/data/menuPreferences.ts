import type { MenuPreference } from '../types';

export const preferenceGroups: {label: string; options: {value: MenuPreference; label: string; icon: string}[]}[] = [
  { label: '맛 취향', options: [
    {value:'spicy', label:'매콤한 맛', icon:'🌶️'},
    {value:'savory', label:'짭짤한 맛', icon:'🧂'},
    {value:'sweet', label:'달콤한 맛', icon:'🍯'},
    {value:'mild', label:'맵지 않은 맛', icon:'🍵'},
    {value:'tangy', label:'새콤한 맛', icon:'🍋'},
    {value:'rich', label:'고소한 맛', icon:'🌰'},
  ]},
  { label: '재료 취향', options: [
    {value:'meat', label:'고기류', icon:'🥩'},
    {value:'seafood', label:'해산물', icon:'🦐'},
    {value:'vegetable', label:'채소 중심', icon:'🥬'},
    {value:'beef', label:'소고기', icon:'🥩'},
    {value:'pork', label:'돼지고기', icon:'🐷'},
    {value:'chicken', label:'닭고기', icon:'🍗'},
  ]},
  { label: '조리·식감', options: [
    {value:'soup',label:'따뜻한 국물',icon:'🍲'},
    {value:'crispy',label:'바삭한 음식',icon:'🍤'},
    {value:'grilled',label:'구이',icon:'🔥'},
    {value:'stirfried',label:'볶음',icon:'🍳'},
  ]},
  { label: '메뉴 형태', options: [
    {value:'rice',label:'밥류',icon:'🍚'},
    {value:'noodle',label:'면류',icon:'🍜'},
    {value:'bread',label:'빵류',icon:'🥪'},
  ]},
];
export const preferenceOptions = preferenceGroups.flatMap(group => group.options);
export const isMenuPreference = (value: unknown): value is MenuPreference => preferenceOptions.some(option => option.value === value);
export const preferenceLabel = (value: MenuPreference) => preferenceOptions.find(option => option.value === value)!.label;
