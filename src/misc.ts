import _ from "lodash";
import { CrudityFilterObject } from "./CrudityFilter";

export function getPageSlice(pageSize: number, page: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { start, end };
}

export function orderBy<T>(array: T[], orderBySpec: string): T[] {
  if (!orderBySpec) {
    return array;
  }
  const fields = orderBySpec.split(",").map((s) => s.replace(/^[-+]/, ""));
  const ascArray = orderBySpec
    .split(",")
    .map((s) => (s.startsWith("-") ? "desc" : "asc"));
  return _.orderBy(array, fields, ascArray);
}

const REGEXP = /^\/(.*)\/(i?)$/;

export function filter<T>(array: T[], filterSpec: CrudityFilterObject): T[] {
  if (!filterSpec) {
    return array;
  }

  const keys = Object.keys(filterSpec);
  if (keys.length === 0) {
    return array;
  }

  const key = keys[0];
  const value = filterSpec[key];

  if (typeof value === "string") {
    const newFilterSpec = { ...filterSpec };
    delete newFilterSpec[key];
    const isRegexp = value.match(REGEXP);
    let checkFn: (t: T, key: string) => boolean = (t, k) => value === t[k];
    if (isRegexp) {
      const spec = value.replace(REGEXP, "$1");
      const flags = value.replace(REGEXP, "$2");
      const regexp = new RegExp(spec, flags);
      checkFn = (t, k) => regexp.test(t[k]);
    }
    return filter(
      array.filter((t) => {
        return checkFn(t, key);
      }),
      newFilterSpec
    );
  }

  if (value instanceof Array) {
    throw new Error("array not handled now. to be done soon");
  }

  return array;
}

export function select<T>(array: T[], selectSpec: string): Partial<T>[] {
  const spec = selectSpec ?? "*";
  if (spec === "*") {
    return array;
  }
  const keys: (keyof T)[] = spec.split(",") as (keyof T)[];
  return array.map((t) => {
    const newT: Partial<T> = {};
    for (const key of keys) {
      if (key in t) {
        newT[key] = t[key];
      }
    }
    return newT;
  });
}
