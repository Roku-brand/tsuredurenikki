export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  lock_pin_hash: string | null;
  lock_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: string;
  user_id: string;
  lock_timeout_minutes: number;
  default_view: string;
  theme: "light" | "dark" | "system" | string;
  created_at: string;
  updated_at: string;
};

export type DiaryEntry = {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  body: string | null;
  mood: number | null;
  stress_level: number | null;
  anxiety_level: number | null;
  fulfillment_level: number | null;
  physical_condition: number | null;
  wake_time: string | null;
  sleep_hours: number | null;
  weather: string | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snack: string | null;
  meal_note: string | null;
  good_things: string | null;
  reflections: string | null;
  learnings: string | null;
  worries: string | null;
  tomorrow_todo: string | null;
  tomorrow_policy: string | null;
  memo: string | null;
  idea_note: string | null;
  news_note: string | null;
  body_weight: number | null;
  word_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type DiaryEntryTag = {
  diary_entry_id: string;
  tag_id: string;
  created_at: string;
};

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  query: string | null;
  filters: Json | null;
  created_at: string;
  updated_at: string;
};

export type EntryWithTags = DiaryEntry & {
  tags: Tag[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "user_id">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettings;
        Insert: Partial<AppSettings> & Pick<AppSettings, "user_id">;
        Update: Partial<AppSettings>;
        Relationships: [];
      };
      diary_entries: {
        Row: DiaryEntry;
        Insert: Partial<DiaryEntry> & Pick<DiaryEntry, "user_id" | "date">;
        Update: Partial<DiaryEntry>;
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: Partial<Tag> & Pick<Tag, "user_id" | "name">;
        Update: Partial<Tag>;
        Relationships: [];
      };
      diary_entry_tags: {
        Row: DiaryEntryTag;
        Insert: Omit<DiaryEntryTag, "created_at"> & Partial<Pick<DiaryEntryTag, "created_at">>;
        Update: Partial<DiaryEntryTag>;
        Relationships: [];
      };
      saved_searches: {
        Row: SavedSearch;
        Insert: Partial<SavedSearch> & Pick<SavedSearch, "user_id" | "name">;
        Update: Partial<SavedSearch>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
