type JSONObject = { [k: string]: any };
export function unwrapVal<T = any>(input: T): T {
  if (Array.isArray(input)) {
    return input.map(unwrapVal) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const obj = input as JSONObject;

    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === 'val') {
      return unwrapVal(obj.val);
    }

    const out: JSONObject = {};
    for (const k of keys) {
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const vk = Object.keys(v);
        if (vk.length === 1 && vk[0] === 'val') {
          out[k] = unwrapVal(v.val);
          continue;
        }
      }
      out[k] = unwrapVal(v);
    }
    return out as T;
  }
  return input;
}


export function unwrapValLax<T = any>(input: T): T {
  if (Array.isArray(input)) return input.map(unwrapValLax) as unknown as T;
  if (input && typeof input === 'object') {
    const obj = input as JSONObject;
    if ('val' in obj) return unwrapValLax((obj as any).val); // קח תמיד val
    const out: JSONObject = {};
    for (const k of Object.keys(obj)) out[k] = unwrapValLax(obj[k]);
    return out as T;
  }
  return input;
}