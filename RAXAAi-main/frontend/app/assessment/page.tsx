"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { usePersistentState } from "../hooks/usePersistentState";
import { getBackendBaseUrl } from "../../utils/apiBase";

const DEFAULT_FORM_DATA = {
  age: 45,
  height: 170, // cm
  weight: 75, // kg
  glucose: 120,
  systolic_bp: 130,
  smoking: 0,
  physical_activity: 1,
  family_history: 0,
};

export default function Assessment() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const backendBaseUrl = getBackendBaseUrl();
  const [formData, setFormData] = usePersistentState(
    "raxa_assessment_form",
    DEFAULT_FORM_DATA,
  );

  // Derived BMI
  const bmi = (formData.weight / (formData.height / 100) ** 2).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      // Prepare payload (match API schema)
      const payload = {
        age: Number(formData.age),
        bmi: Number(bmi),
        glucose: Number(formData.glucose),
        systolic_bp: Number(formData.systolic_bp),
        smoking: Number(formData.smoking),
        physical_activity: Number(formData.physical_activity),
        family_history: Number(formData.family_history),
      };

      // Call API with timeout
      const res = await axios.post(
        `${backendBaseUrl}/predict`,
        payload,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      // Store result and inputs (for PDF generation)
      localStorage.setItem("raxa_result", JSON.stringify(res.data));
      localStorage.setItem(
        "raxa_inputs",
        JSON.stringify({
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          bmi: bmi,
          glucose: formData.glucose,
          systolic_bp: formData.systolic_bp,
          smoking: formData.smoking === 0 ? "No" : "Yes",
          physical_activity:
            formData.physical_activity === 0
              ? "Low"
              : formData.physical_activity === 1
                ? "Moderate"
                : "High",
        }),
      );

      // Navigate
      router.push("/dashboard");
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (axios.isAxiosError(error) && error.code === "ECONNABORTED")
      ) {
        alert(
          "Request timed out. Please ensure the backend server is running on port 8000.",
        );
      } else {
        const msg =
          (axios.isAxiosError(error) && error.response?.data?.detail) ||
          "Ensure Backend is running on port 8000.";
        alert(`API Error: ${msg}`);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              {t["start_assessment"] || "Patient Assessment"}
            </h2>
            <p className="text-slate-400">
              {t["hero_subtitle"] || "Enter patient vitals for AI analysis."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Section 1: Demographics */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  1
                </span>
                {t["basic_details"]}
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["age_label"]}
                  </label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="90"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["height_label"]}
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    max="250"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["weight_label"]}
                  </label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="200"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-500">
                  {t["calculated_bmi"]}:{" "}
                </span>
                <span
                  className={`font-bold ${Number(bmi) > 25 ? "text-orange-600" : "text-emerald-600"}`}
                >
                  {bmi}
                </span>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t["family_history_label"] || "Family History (Diabetes/BP)"}
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.family_history}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      family_history: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>{t["family_no"] || "No"}</option>
                  <option value={1}>{t["family_yes"] || "Yes"}</option>
                </select>
              </div>
            </div>

            {/* Section 2: Vitals */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  2
                </span>
                {t["clinical_vitals"]}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["glucose_label"]}
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="400"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.glucose}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        glucose: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["bp_label"]}
                  </label>
                  <input
                    type="number"
                    required
                    min="70"
                    max="250"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.systolic_bp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        systolic_bp: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Lifestyle */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  3
                </span>
                {t["lifestyle_habits"]}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["smoking_label"]}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.smoking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smoking: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>{t["smoking_no"]}</option>
                    <option value={1}>{t["smoking_yes"]}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t["activity_label"]}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.physical_activity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        physical_activity: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>{t["activity_low"]}</option>
                    <option value={1}>{t["activity_moderate"]}</option>
                    <option value={2}>{t["activity_high"]}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">{t["assessment_note"]}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />{" "}
                  {t["analyzing_button"]}
                </>
              ) : (
                <>
                  {t["generate_button"]} <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
