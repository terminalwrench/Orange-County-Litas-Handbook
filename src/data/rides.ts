import type { RideRecord } from "../types";

export const rideRecords: RideRecord[] = [
  {
    id: "branch-ride-jul",
    title: "Branch Ride",
    date: "2026-07-25",
    status: "Planning",
    meetup: "",
    destination: "",
    mileage: "",
    duration: "Flexible",
    difficulty: "Intermediate",
    estimatedDistance: "",
    estimatedRideTime: "Flexible",
    freeways: false,
    startingLocation: "",
    kickstandsUp: "",
    totalDistance: "",
    routeDuration: "",
    rideType: "Group Ride",
    visibility: "Chapter Only",
    weatherPolicy: "Leader Decision",
    stops: [],
    notes: "Confirm fuel, regroup, weather, and direct-arrival option."
  },
  {
    id: "beach-day",
    title: "Litas Beach Day Ride",
    date: "2026-08-15",
    status: "Planning",
    meetup: "",
    destination: "",
    mileage: "Local",
    duration: "Flexible",
    difficulty: "Beginner Friendly",
    estimatedDistance: "Local",
    estimatedRideTime: "Flexible",
    freeways: false,
    startingLocation: "",
    kickstandsUp: "",
    totalDistance: "Local",
    routeDuration: "Flexible",
    rideType: "Beginner Ride",
    visibility: "Chapter Only",
    weatherPolicy: "Leader Decision",
    stops: [
      {
        id: "beach-day-stop-1",
        type: "Meetup",
        location: "",
        notes: "Confirm parking and arrival instructions."
      }
    ],
    notes: "Confirm parking, sand exposure, crowds, and backup destination."
  }
];
