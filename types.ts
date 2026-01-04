
export interface FabricRoll {
  id: string;
  lotNumber: string;
  meters: number;
  remarks: string;
  // Added properties for Hold/Release status tracking
  isHold?: boolean;
  holdReason?: string;
}

export interface FabricItem {
  id: string;
  name: string; // Group Name
  color: string;
  category: string; // New Category tag
  rolls: FabricRoll[]; // Individual roll tracking
  quantityMeters: number; // Derived total
  widthIn: number;
  gsm: number;
  composition: string;
  location: string;
  imageUrl?: string;
  lastUpdated: string;
  isFavorite?: boolean;
}

export type ChallanMainType = 'Issue' | 'Receive' | 'Checking';

export type ChallanSubType = 
  | 'Mill' | 'Sales' | 'Sampling' | 'Other' // Issue types
  | 'Grey' | 'Mill Receipt' | 'Purchase' | 'Sampling Receipt' | 'Other' // Receive types
  | 'Refolding' | 'Hold/Release'; // Checking types (added)

export interface SelectedIssueRoll {
  rollId: string;
  metersToIssue: number;
  isPartial: boolean;
  // Added for Refolding adjustments where meters are changed instead of just issued
  newMeters?: number;
}

// Added interface for Hold/Release actions
export interface HoldAction {
  rollId: string;
  action: 'Hold' | 'Release';
  reason?: string;
}

export interface ChallanItem {
  fabricId: string;
  fabricName: string;
  color: string;
  selectedRolls?: SelectedIssueRoll[]; // Updated for partial/full issue
  newRolls?: FabricRoll[]; // For Receive
  totalMeters: number;
  // Added to track hold/release actions in Checking challans
  holdActions?: HoldAction[];
}

export interface Challan {
  id: string;
  number: string;
  date: string;
  partyName: string;
  mainType: ChallanMainType;
  subType: ChallanSubType;
  items: ChallanItem[];
  status: 'Draft' | 'Sent' | 'Received';
  remarks?: string;
  isTransferred?: boolean;
  transferredTo?: ChallanSubType;
}
