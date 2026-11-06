import { AthleteStanding, TeamStanding } from '../types/ranking';

export class TeamScoringEngine {
  // Official IPF team points distribution
  private static readonly IPF_POINTS_SCALE = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  /**
   * Calculates team scores based on category placings.
   */
  public static calculate(
    categoryStandings: Record<string, AthleteStanding[]>,
    maxScoringLiftersPerTeam: number = 5
  ): TeamStanding[] {
    const teamMap: Record<
      string,
      {
        teamName: string;
        lifters: TeamStanding['lifters'];
      }
    > = {};

    for (const cat in categoryStandings) {
      const standings = categoryStandings[cat];
      for (const athlete of standings) {
        if (!athlete.team || !athlete.categoryRank) continue;
        if (athlete.lifterStatus === 'eliminated' || athlete.lifterStatus === 'disqualified') continue;

        const rank = athlete.categoryRank;
        const points =
          rank >= 1 && rank <= this.IPF_POINTS_SCALE.length
            ? this.IPF_POINTS_SCALE[rank - 1]
            : 0;

        if (points > 0) {
          if (!teamMap[athlete.team]) {
            teamMap[athlete.team] = {
              teamName: athlete.team,
              lifters: [],
            };
          }

          teamMap[athlete.team].lifters.push({
            athleteId: athlete.athleteId,
            athleteName: athlete.name,
            category: athlete.category,
            rank,
            points,
          });
        }
      }
    }

    // Aggregate team totals (taking up to maxScoringLiftersPerTeam sorted by highest points)
    const results: TeamStanding[] = Object.values(teamMap).map((team) => {
      // Sort lifters by points descending
      const sortedLifters = [...team.lifters].sort((a, b) => b.points - a.points);
      const countingLifters = sortedLifters.slice(0, maxScoringLiftersPerTeam);
      const totalPoints = countingLifters.reduce((acc, curr) => acc + curr.points, 0);

      return {
        teamName: team.teamName,
        totalPoints,
        topLiftersCount: countingLifters.length,
        lifters: countingLifters,
      };
    });

    // Sort teams by total points descending
    return results.sort((a, b) => b.totalPoints - a.totalPoints);
  }
}

