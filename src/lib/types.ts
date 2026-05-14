export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  contact_email: string | null;
  is_banned: boolean;
  verified: boolean;
  is_admin: boolean;
  response_speed: 'fast' | 'medium' | 'slow' | 'unknown';
  listings_today: number;
  listings_today_reset: string | null;
  level: number;
  level_title: string | null;
  badge_color: string | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sort_order: number;
  parent_id: string | null;
  subcategories?: Category[];
}

export interface Listing {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  phone: string;
  contact_email: string;
  images: string[];
  is_featured: boolean;
  views: number;
  status: 'active' | 'sold' | 'ended' | 'deleted';
  listing_type: 'regular' | 'auction';
  delivery_options: string[];
  sold_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  category?: Category;
  auction?: Auction;
  is_favorited?: boolean;
}

export interface Auction {
  id: string;
  listing_id: string;
  seller_id: string;
  starting_price: number;
  current_price: number;
  min_bid_increment: number;
  duration_hours: 24 | 48;
  ends_at: string;
  timer_started: boolean;
  timer_started_at: string | null;
  extension_count: number;
  status: 'active' | 'ended' | 'sold' | 'cancelled';
  winner_id: string | null;
  bid_count: number;
  created_at: string;
  updated_at: string;
  winner?: Profile;
  bids?: AuctionBid[];
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder?: Profile;
}

export interface SellerBadge {
  id: string;
  seller_id: string;
  badge_type: 'reliable' | 'neutral' | 'low_reliability';
  total_ratings: number;
  avg_score: number;
  total_sales: number;
  updated_at: string;
}

export interface ListingRating {
  id: string;
  listing_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string;
  created_at: string;
  rater?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listing?: Listing;
  buyer?: Profile;
  seller?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  seen_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Job {
  id: string;
  poster_id: string;
  title: string;
  company: string;
  description: string;
  category: string;
  type: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string | null;
  remote: boolean;
  status: 'active' | 'closed' | 'deleted';
  expires_at: string;
  created_at: string;
  updated_at: string;
  poster?: Profile;
}

export interface JobSeekerAd {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  location: string;
  remote: boolean;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string;
  contact_email: string;
  contact_phone: string;
  experience: string;
  status: 'active' | 'deleted';
  expires_at: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_listing_id: string | null;
  reason: 'spam' | 'scam' | 'inappropriate' | 'duplicate' | 'offensive' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reporter?: Profile;
  reported_user?: Profile;
  reported_listing?: Listing;
}
