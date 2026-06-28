export type ActionResult<T = undefined> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type SearchFilters = {
  keyword?: string;
  from?: string;
  to?: string;
  tags?: string[];
  mood?: number[];
  stressLevel?: number[];
  sleepHoursMin?: number;
  sleepHoursMax?: number;
  hasMealLog?: boolean;
};
