export function getFollowUp(risk: "Low" | "Medium" | "High") {
  const now = new Date();
  let months = 12;
  let messageKey = "rescreen_12_months";

  if (risk === "Medium") {
    months = 6;
    messageKey = "rescreen_6_months";
  }
  if (risk === "High") {
    months = 3;
    messageKey = "rescreen_3_months";
  }

  const followUpDate = new Date(now.setMonth(now.getMonth() + months));

  return {
    months,
    followUpDate: followUpDate.toLocaleDateString(),
    messageKey,
  };
}
