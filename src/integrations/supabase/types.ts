export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      test_sessions: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      test_results: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      test_errors: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      questions: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      folders: {
         Row: any;
         Insert: any;
         Update: any;
         Relationships: any[];
      };
      // Catch-all for other tables to avoid 'never' errors
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    }
    Views: {
      [key: string]: {
        Row: any
      }
    }
    Functions: {
      [key: string]: {
        Args: any
        Returns: any
      }
    }
    Enums: {
      [key: string]: any
    }
    CompositeTypes: {
      [key: string]: any
    }
  }
}
