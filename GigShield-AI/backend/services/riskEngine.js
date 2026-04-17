/**
 * Risk Engine
 * Calculates risk score and determines premium based on user profile
 */

function calculateRisk(user) {
  let score = 0;

  // Location-based risk (some cities are more prone to disruptions)
  if (user.city === 'Delhi') score += 30;
  if (user.city === 'Mumbai') score += 40;
  if (user.city === 'Bangalore') score += 20;
  if (user.city === 'Hyderabad') score += 15;
  if (user.city === 'Chennai') score += 25;
  if (user.city === 'Kolkata') score += 35;

  // Income-based risk (higher income = higher claim potential)
  if (user.avgWeeklyIncome > 20000) score += 10;

  return Math.min(score, 100); // Cap at 100
}

function getPremium(riskScore) {
  // Premium tiers based on risk
  if (riskScore < 30) return 49;
  if (riskScore < 70) return 69;
  return 99;
}

module.exports = {
  calculateRisk,
  getPremium
};
