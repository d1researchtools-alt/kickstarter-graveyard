export interface Project {
  name: string;
  kickstarter_url: string;
  image_url: string;
  amount_raised: number;
  backers: number;
  goal: number;
  funded_date: string;
  last_update: string;
  category: string;
  failure_reason: string;
  sources: string[];
  tags: string[];
}
