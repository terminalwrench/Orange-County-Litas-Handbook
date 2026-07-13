export interface RideStop {
  id: string;
  type: string;
  location: string;
  arrivalTime?: string;
  notes?: string;
}

export interface RideRecord {
  id: string;
  eventId?: string;
  title: string;
  date: string;
  status?: string;
  time?: string;
  meetup: string;
  destination: string;
  mileage: string;
  duration: string;
  difficulty: string;
  rideLeader?: string;
  sweep?: string;
  estimatedDistance?: string;
  estimatedRideTime?: string;
  freeways?: boolean;
  meetupTime?: string;
  startingLocation?: string;
  kickstandsUp?: string;
  primaryRouteLink?: string;
  alternativeRouteLink?: string;
  totalDistance?: string;
  routeDuration?: string;
  rideType?: string;
  visibility?: string;
  weatherPolicy?: string;
  stops?: RideStop[];
  notes: string;
}
