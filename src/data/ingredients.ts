import type { IngredientTag, MenuIngredientInfo } from '../types';

export const ingredientGroups: {label:string; options:{value:IngredientTag;label:string}[]}[] = [
  {label:'유제품·곡물·견과류',options:[
    {value:'milk',label:'우유·유제품'},{value:'egg',label:'달걀'},{value:'wheat',label:'밀'},
    {value:'buckwheat',label:'메밀'},{value:'soy',label:'대두·콩'},{value:'peanut',label:'땅콩'},
    {value:'tree_nut',label:'견과류'},{value:'sesame',label:'참깨'},
  ]},
  {label:'생선·해산물',options:[
    {value:'fish',label:'생선'},{value:'shrimp',label:'새우'},{value:'crab',label:'게'},
    {value:'squid',label:'오징어'},{value:'shellfish',label:'조개류'},
  ]},
  {label:'고기',options:[
    {value:'beef',label:'소고기'},{value:'pork',label:'돼지고기'},{value:'chicken',label:'닭고기'},
    {value:'duck',label:'오리고기'},{value:'lamb',label:'양고기'},
  ]},
  {label:'채소·과일·향신 재료',options:[
    {value:'peach',label:'복숭아'},{value:'tomato',label:'토마토'},{value:'garlic',label:'마늘'},
    {value:'onion',label:'양파'},{value:'mushroom',label:'버섯'},{value:'cilantro',label:'고수'},
  ]},
];
export const ingredientOptions=ingredientGroups.flatMap(group=>group.options);
export const isIngredientTag=(value:unknown):value is IngredientTag=>ingredientOptions.some(option=>option.value===value);
export const ingredientLabel=(value:IngredientTag)=>ingredientOptions.find(option=>option.value===value)!.label;
export const isIngredientInfo=(value:unknown):value is MenuIngredientInfo=>{
  if(!value||typeof value!=='object')return false;
  const info=value as Partial<MenuIngredientInfo>;
  return typeof info.complete==='boolean'&&Array.isArray(info.contains)&&info.contains.every(isIngredientTag)&&Array.isArray(info.mayContain)&&info.mayContain.every(isIngredientTag);
};
