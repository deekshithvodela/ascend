import { Athlete } from '../types/athlete';
import { FlightGroup, LiftType } from '../types/attempt';

export class FlightManager {
  /**
   * Distributes athletes into flights (e.g. Flight A, Flight B) based on
   * maximum flight size (IPF standard: up to 14 lifters per flight).
   */
  public static createFlights(
    athletes: Athlete[],
    maxFlightSize: number = 14,
    liftType: LiftType = 'squat'
  ): FlightGroup[] {
    // Sort athletes by declared opening weight or lot number
    const activeAthletes = athletes.filter(
      (a) => a.lifterStatus !== 'disqualified' && a.lifterStatus !== 'withdrawn'
    );

    const flightLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const flights: FlightGroup[] = [];

    const numFlights = Math.ceil(activeAthletes.length / maxFlightSize) || 1;
    const baseCount = Math.floor(activeAthletes.length / numFlights);
    const extra = activeAthletes.length % numFlights;

    let currentIndex = 0;
    for (let i = 0; i < numFlights; i++) {
      const flightSize = baseCount + (i < extra ? 1 : 0);
      const flightAthletes = activeAthletes.slice(currentIndex, currentIndex + flightSize);
      currentIndex += flightSize;

      const flightLetter = flightLetters[i] || `Group-${i + 1}`;
      flights.push({
        id: `flight-${flightLetter.toLowerCase()}`,
        name: `Flight ${flightLetter}`,
        athleteIds: flightAthletes.map((a) => a.id),
        liftType,
        currentRound: 1,
      });
    }

    return flights;
  }
}

