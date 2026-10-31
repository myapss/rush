import type { NoteCode, NotApplicableReason } from "./types";

export const NOT_APPLICABLE_MESSAGE: Record<NotApplicableReason, string> = {
  under_18:
    "This calculator is designed for adults. Children and teenagers have different energy needs for growth, so please talk to a doctor, school nurse or registered dietitian for advice.",
  pregnancy:
    "Energy and nutrient needs change during pregnancy and breastfeeding, and standard equations don't account for this. Please ask your midwife, doctor or a registered dietitian for personalized advice.",
  eating_disorder_history:
    "We don't provide calorie targets when there's a history of disordered eating. A doctor or registered dietitian can give you support that's right for you.",
};

export const NOTE_MESSAGE: Partial<Record<NoteCode, string>> = {
  underweight_no_loss:
    "Your BMI is below 18.5, so we've shown a maintenance estimate instead of weight loss. Consider speaking to a doctor.",
  deficit_too_small: "A weight-loss target would go below a safe minimum intake for you, so we've shown maintenance instead.",
  calorie_floor_applied: "We raised the estimate to a minimum we don't go below without medical supervision.",
  high_bmi_reference_weight: "Protein is based on a reference weight for your height, so it isn't overestimated.",
  medical_condition:
    "Because you told us about a medical condition, protein is set conservatively. Please check these targets with your doctor or dietitian.",
};
