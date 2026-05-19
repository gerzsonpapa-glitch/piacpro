// Trust szintek: 0=új, 1=alap, 2=megbízható, 3=ellenőrzött eladó, 4=partner, 5=official
export type TrustLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  0: 'Új felhasználó',
  1: 'Alap felhasználó',
  2: 'Megbízható',
  3: 'Ellenőrzött eladó',
  4: 'Partner',
  5: 'Hivatalos szervezet',
};

export const TRUST_LEVEL_COLORS: Record<TrustLevel, string> = {
  0: 'text-zinc-500',
  1: 'text-zinc-400',
  2: 'text-blue-400',
  3: 'text-teal-400',
  4: 'text-amber-400',
  5: 'text-emerald-400',
};

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
  is_super_admin: boolean;
  is_shop_owner: boolean;
  response_speed: 'fast' | 'medium' | 'slow' | 'unknown';
  listings_today: number;
  listings_today_reset: string | null;
  level: number;
  level_title: string | null;
  badge_color: string | null;
  last_seen: string | null;
  total_sales: number;
  avg_rating: number;
  total_reviews: number;
  positive_ratio: number;
  rank_level: number;
  rank_title: string;
  is_producer_approved: boolean;
  ai_access: boolean;
  trust_level: TrustLevel;
  created_at: string;
  updated_at: string;
}

export interface Producer {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  bio: string;
  cover_url: string | null;
  avatar_url: string | null;
  location: string;
  lat: number | null;
  lng: number | null;
  is_verified: boolean;
  is_local_favorite: boolean;
  is_available_today: boolean;
  categories: string[];
  contact_phone: string | null;
  contact_email: string | null;
  avg_rating: number;
  review_count: number;
  transaction_count: number;
  created_at: string;
  profile?: Profile;
  products?: ProducerProduct[];
}

export interface ProducerProduct {
  id: string;
  producer_id: string;
  name: string;
  description: string;
  images: string[];
  price: number | null;
  unit: string;
  category_tag: string | null;
  is_available: boolean;
  is_seasonal: boolean;
  is_fresh_harvest: boolean;
  stock_note: string | null;
  stock_quantity: number | null;
  created_at: string;
}

export interface ProducerApplication {
  id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  category: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  products?: ShopProduct[];
  promotions?: ShopPromotion[];
  product_count?: number;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_tag: string;
  images: string[];
  stock: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopPromotion {
  id: string;
  shop_id: string;
  title: string;
  description: string;
  discount_percent: number | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
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

export type ListingType = 'regular' | 'auction' | 'job' | 'donation' | 'shop' | 'producer' | 'service';
export type ModerationStatus = 'pending' | 'active' | 'rejected' | 'hidden';

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
  lat: number | null;
  lng: number | null;
  phone: string;
  contact_email: string;
  images: string[];
  video_url: string | null;
  negotiable: boolean;
  bumped_at: string | null;
  is_featured: boolean;
  views: number;
  status: 'active' | 'sold' | 'ended' | 'deleted';
  listing_type: ListingType;
  moderation_status: ModerationStatus;
  trust_required: number;
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

export interface Transaction {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  conversation_id: string | null;
  status: 'chat_started' | 'deal_pending' | 'completed' | 'cancelled';
  sold_to_buyer_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingReview {
  id: string;
  transaction_id: string | null;
  listing_id: string | null;
  reviewer_id: string;
  reviewed_id: string;
  score: number;
  comment: string;
  recommended: boolean;
  created_at: string;
  reviewer?: Profile;
  listing?: Listing;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  shop_product_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  transaction_id: string | null;
  sold_status: 'sold' | 'pending' | null;
  created_at: string;
  listing?: Listing;
  shop_product?: ShopProduct;
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

export interface Donation {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: 'gyerek' | 'allatvédelem' | 'raszorulok' | 'kozossegi' | 'egeszseg' | 'katasztrofa' | 'oktatás' | 'sport' | 'vallasi' | 'kornyezet' | 'egyeb';
  goal_amount: number;
  current_amount: number;
  escrow_amount: number;
  images: string[];
  location: string;
  is_verified: boolean;
  status: 'active' | 'ended' | 'cancelled';
  moderation_status: ModerationStatus;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  contributions?: DonationContribution[];
}

export interface DonationContribution {
  id: string;
  donation_id: string;
  donor_id: string | null;
  amount: number;
  message: string;
  is_anonymous: boolean;
  created_at: string;
  donor?: Profile;
}

export type OfferType = 'item' | 'service';
export type OfferStatus = 'active' | 'pending' | 'claimed' | 'fulfilled';

export type OfferCategory =
  | 'gyerek' | 'allatvédelem' | 'raszorulok' | 'kozossegi'
  | 'egeszseg' | 'katasztrofa' | 'oktatás' | 'sport' | 'vallasi' | 'kornyezet'
  | 'ruha' | 'elelmiszer' | 'butor' | 'jatekok' | 'felszereles'
  | 'fuvar' | 'rendezvenysegites' | 'szaksegitseg' | 'egyeb';

export interface SupportOffer {
  id: string;
  donation_id: string | null;
  user_id: string;
  type: OfferType;
  title: string;
  description: string;
  category: OfferCategory;
  item_type: string | null;
  service_type: string | null;
  quantity: number | null;
  location: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  status: OfferStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  claimer?: Profile;
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
