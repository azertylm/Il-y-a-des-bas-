import { METRIC_AXIS, NEUTRAL_METRICS } from "../constants.ts";
import type { Message, OpinionMetrics } from "../types.ts";

/**
 * Répartit 100 points entre les quatre axes au prorata du poids de chaque
 * intervention. L'ancien calcul cumulait des points bornés à 100 par axe :
 * les quatre jauges étaient donc pleines dès le sixième message et
 * n'apprenaient plus rien au lecteur.
 */
export function computeOpinionMetrics(messages: Message[]): OpinionMetrics {
  const weights: OpinionMetrics = { rigueur: 0, ethique: 0, pragmatisme: 0, culture: 0 };

  messages.forEach(m => {
    const axis = METRIC_AXIS[m.agentId];
    if (!axis) return; // les interventions humaines ne pèsent sur aucun axe
    // Les soutiens du public amplifient le poids d'une intervention.
    weights[axis] += 1 + (m.claps || 0) * 0.5;
  });

  const axes = Object.keys(weights) as (keyof OpinionMetrics)[];
  const total = axes.reduce((sum, axis) => sum + weights[axis], 0);
  if (total === 0) return { ...NEUTRAL_METRICS };

  // Méthode des plus forts restes : les quatre parts totalisent exactement 100.
  const exact = axes.map(axis => ({ axis, value: (weights[axis] / total) * 100 }));
  const result = { rigueur: 0, ethique: 0, pragmatisme: 0, culture: 0 } as OpinionMetrics;
  exact.forEach(({ axis, value }) => { result[axis] = Math.floor(value); });

  let remainder = 100 - axes.reduce((sum, axis) => sum + result[axis], 0);
  exact
    .sort((a, b) => (b.value % 1) - (a.value % 1))
    .forEach(({ axis }) => {
      if (remainder > 0) { result[axis] += 1; remainder -= 1; }
    });

  return result;
}
