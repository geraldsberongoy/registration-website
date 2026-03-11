"use client";

import { useState } from "react";
import { SurveyConfig } from "@/types/survey";
import { Loader2, Star, Check, User, Mail } from "lucide-react";
import { submitSurveyResponseAction } from "@/actions/surveyActions";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface SurveyFormProps {
  slug: string;
  config: SurveyConfig;
  userProfile?: UserProfile | null;
  initialAnswers?: Record<string, any> | null;
}

export default function SurveyForm({
  slug,
  config,
  userProfile,
  initialAnswers,
}: SurveyFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>(
    initialAnswers || {},
  );
  const [email, setEmail] = useState(userProfile?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [certificateBase64, setCertificateBase64] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // If initialAnswers exists, the view mode condition below handles the summary view.
  // If initialAnswers is null, we render the form directly in 'create' mode (isEditing=false).

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      for (const q of config.questions) {
        if (
          q.required &&
          (answers[q.id] === undefined || answers[q.id] === "")
        ) {
          setError(`Please answer required question: "${q.text}"`);
          setIsSubmitting(false);
          return;
        }
      }

      // Submit without passing email client-side
      const result = await submitSurveyResponseAction(slug, answers);

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        if (result.data?.certificateBase64) {
          setCertificateBase64(result.data.certificateBase64);
        }
        // If we were editing, stay in view mode or show success
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Mode (Read-only summary)
  if (!isEditing && !submitted && initialAnswers) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400 border border-cyan-500/30">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-urbanist">
            Response Submitted
          </h2>
          <p className="text-white/60 mb-6 font-urbanist">
            You have already submitted a response for this event.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/20 font-urbanist"
          >
            Edit Response
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 font-urbanist tracking-tight">
          Thank you!
        </h2>
        <p className="text-white/60 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Your feedback has been recorded. We appreciate you taking the time to
          help us improve.
        </p>

        {certificateBase64 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 font-urbanist flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              Your Certificate of Participation
            </h3>
            <div className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-[0_0_40px_rgba(8,145,178,0.3)] border border-cyan-500/30 group">
              {/* Display the Base64 PNG inline */}
              <img
                src={`data:image/png;base64,${certificateBase64}`}
                alt="Certificate"
                className="w-full h-auto object-contain bg-white/5 transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <a
              href={`data:image/png;base64,${certificateBase64}`}
              download={`Certificate_${slug}.png`}
              className="mt-8 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-cyan-500/30 font-urbanist tracking-wide"
            >
              Download Certificate
            </a>
          </div>
        )}

        <button
          onClick={() => router.push(`/event/${slug}`)}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10 hover:border-white/20 shadow-lg hover:shadow-cyan-500/10 font-urbanist"
        >
          Back to Event
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      {/* Respondent Identity Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 font-urbanist tracking-wide flex items-center gap-2">
          <User className="text-cyan-400" size={24} />
          Respondent Details
        </h3>

        {userProfile ? (
          <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {userProfile.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-cyan-500/50"
                  unoptimized // Optional: needed if external images not configured in next.config.js
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cyan-600/20 flex items-center justify-center border-2 border-cyan-500/30 text-cyan-400 text-xl font-bold font-urbanist">
                  {userProfile.first_name?.[0]}
                  {userProfile.last_name?.[0]}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1">
              <div className="text-xl font-bold text-white font-urbanist">
                {userProfile.first_name} {userProfile.last_name}
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm font-urbanist">
                <Mail size={14} />
                {userProfile.email}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-lg font-bold text-white font-urbanist tracking-wide">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-urbanist text-lg"
            />
            <p className="text-sm text-white/40 font-urbanist">
              Please enter the email you used to register for this event.
            </p>
          </div>
        )}
      </div>

      {/* Questions */}
      {config.questions.map((q, idx) => (
        <div
          key={q.id}
          className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl transition-transform hover:scale-[1.01] duration-300"
        >
          <label className="block text-lg md:text-xl font-bold text-white font-urbanist leading-snug">
            <span className="text-cyan-400 mr-2">{idx + 1}.</span>
            {q.text}
            {q.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {/* Render Input Based on Type */}
          <div className="pt-2">
            {q.type === "text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-urbanist resize-none text-base disabled:opacity-50"
              />
            )}

            {q.type === "rating" && (
              <div className="flex gap-2 sm:gap-4 flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, star)}
                    className={`p-3 sm:p-4 rounded-xl transition-all duration-300 group ${
                      (answers[q.id] || 0) >= star
                        ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                        : "bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/40"
                    }`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110 ${
                        (answers[q.id] || 0) >= star ? "fill-yellow-400" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            {q.type === "yes_no" && (
              <div className="flex gap-4">
                {["Yes", "No"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, option)}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all font-urbanist border ${
                      answers[q.id] === option
                        ? "bg-cyan-600 text-white border-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.4)] scale-[1.02]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {q.type === "multiple_choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options?.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, option)}
                    className={`px-5 py-4 rounded-xl text-left font-medium transition-all font-urbanist border flex items-center justify-between group ${
                      answers[q.id] === option
                        ? "bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span>{option}</span>
                    {answers[q.id] === option && (
                      <Check className="w-5 h-5 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-center font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div
        className={`pt-4 pb-12 grid gap-4 ${isEditing ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
      >
        {isEditing && (
          <button
            type="button" // Important: type="button" to prevent form submission
            onClick={() => {
              setIsEditing(false);
              setAnswers(initialAnswers || {});
            }}
            disabled={isSubmitting}
            className="w-full px-8 py-5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl text-xl font-bold transition-all border border-white/10 font-urbanist"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-2xl text-xl font-bold transition-all shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-urbanist tracking-wide flex items-center justify-center gap-3 group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {isEditing ? "Updating..." : "Submitting..."}
            </>
          ) : (
            <>
              {isEditing ? "Update Feedback" : "Submit Feedback"}
              <Check className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity -ml-6 group-hover:ml-0" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
