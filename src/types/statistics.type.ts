import { Document } from "mongoose";

export interface IStatistics extends Document {
  views?: number;
  views_per_day?: number;
  views_per_week?: number;
  views_per_month?: number;
  avg_region_price?: number;
  avg_price?: number;
}

export interface View {
  timestamp: number;
}
export interface IViews extends Document {
  views: View[];
}
