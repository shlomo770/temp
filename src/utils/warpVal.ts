// src/utils/wrapVal.ts
export function wrapVal(input: any): any {
    if (Array.isArray(input)) return input.map(wrapVal);
    if (input && typeof input === 'object') {
      const out: any = {};
      for (const k of Object.keys(input)) out[k] = wrapVal(input[k]);
      return out;
    }
    return { val: input }; 
  }