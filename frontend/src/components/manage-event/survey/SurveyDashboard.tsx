"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileCheck,
  Users,
  UserCheck,
  UserX,
  Download,
  Loader2,
  RefreshCw,
  Percent,
  AlertCircle,
  Eye,
  X,
  Search,
} from "lucide-react";
import {
  getSurveyDashboardStatsAction,
  getSurveyDashboardDetailsAction,
} from "@/actions/surveyActions";
import { downloadCSV } from "@/utils/fileDownload";
import { useNotification } from "@/hooks/use-notification";
import type { SurveyConfig } from "@/types/survey";

interface SurveyDashboardProps {
  slug: string;
  surveyConfig?: SurveyConfig;
}

interface SurveyDashboardStats {
  totalRegistered: number;
  attended: number;
  surveyAnswered: number;
  registeredWithoutSurvey: number;
}

interface SurveyResponderRow {
  users_id: string;
  email: string;
  first_name: string;
  last_name: string;
  survey_answered: boolean;
  survey_completed_at: string | null;
  answers: Record<string, unknown> | null;
}

function FeedbackModal({
  isOpen,
  onClose,
  attendeeName,
  attendeeEmail,
  answers,
  surveyConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  attendeeName: string;
  attendeeEmail: string;
  answers: Record<string, unknown> | null;
  surveyConfig?: SurveyConfig;
}) {
  if (!isOpen) return null;

  const questions = surveyConfig?.questions ?? [];
  const questionMap = new Map(questions.map((q) => [q.id, q.text]));

  const entries =
    answers && Object.keys(answers).length > 0
      ? questions
          .filter((q) => q.id in answers)
          .map((q) => ({
            question: q.text,
            answer: answers[q.id],
          }))
      : Object.entries(answers ?? {}).map(([id, val]) => ({
          question: questionMap.get(id) ?? `Question ${id}`,
          answer: val,
        }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[#0a1520] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Survey Feedback</h3>
            <p className="text-sm text-white/60 mt-0.5">
              {attendeeName} {attendeeEmail && `• ${attendeeEmail}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {entries.length === 0 ? (
            <p className="text-white/50">No feedback responses.</p>
          ) : (
            entries.map(({ question, answer }, idx) => (
              <div
                key={idx}
                className="border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-white/80 mb-1">
                  {question}
                </p>
                <p className="text-white">
                  {answer !== undefined && answer !== null
                    ? String(answer)
                    : "—"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function buildCsvFromRows(
  rows: SurveyResponderRow[],
  surveyConfig?: SurveyConfig,
): string {
  const questions = surveyConfig?.questions ?? [];
  const baseHeaders = [
    "email",
    "first_name",
    "last_name",
    "survey_answered",
    "survey_completed_at",
  ];
  const questionHeaders = questions.map((q) =>
    (q.text || `Q_${q.id}`)
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, ""),
  );
  const headers = [...baseHeaders, ...questionHeaders];

  const csvRows = rows.map((row) => {
    const baseRow = [
      row.email || "",
      row.first_name || "",
      row.last_name || "",
      row.survey_answered ? "Yes" : "No",
      row.survey_completed_at ?? "",
    ];
    const answerCols = questions.map((q) => {
      const val = row.answers?.[q.id];
      return val !== undefined && val !== null ? String(val) : "";
    });
    return [...baseRow, ...answerCols];
  });

  return [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
}

export default function SurveyDashboard({
  slug,
  surveyConfig,
}: SurveyDashboardProps) {
  const [stats, setStats] = useState<SurveyDashboardStats | null>(null);
  const [details, setDetails] = useState<SurveyResponderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackRow, setFeedbackRow] = useState<SurveyResponderRow | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [surveyFilter, setSurveyFilter] = useState<
    "all" | "answered" | "not_answered"
  >("all");
  const { showSuccess, showError } = useNotification();

  const filteredDetails = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    return details.filter((row) => {
      const matchesSearch =
        !lowerQuery ||
        row.first_name?.toLowerCase().includes(lowerQuery) ||
        row.last_name?.toLowerCase().includes(lowerQuery) ||
        row.email?.toLowerCase().includes(lowerQuery);
      const matchesSurvey =
        surveyFilter === "all" ||
        (surveyFilter === "answered"
          ? row.survey_answered
          : !row.survey_answered);
      return matchesSearch && matchesSurvey;
    });
  }, [details, searchQuery, surveyFilter]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const [statsResult, detailsResult] = await Promise.all([
          getSurveyDashboardStatsAction(slug),
          getSurveyDashboardDetailsAction(slug),
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as SurveyDashboardStats);
        } else if (!statsResult.success) {
          setError(
            (statsResult as { error?: string }).error || "Failed to load stats",
          );
        }

        if (detailsResult.success && detailsResult.data) {
          setDetails((detailsResult.data as SurveyResponderRow[]) || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleExport = () => {
    setExporting(true);
    try {
      const csvData = buildCsvFromRows(filteredDetails, surveyConfig);
      if (filteredDetails.length === 0) {
        showError("No data to export. Try adjusting the filter.");
      } else {
        downloadCSV(csvData, `survey-dashboard-${slug}.csv`);
        showSuccess(
          `Exported ${filteredDetails.length} row${filteredDetails.length === 1 ? "" : "s"}`,
        );
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const completionRate =
    stats && stats.totalRegistered > 0
      ? Math.round((stats.surveyAnswered / stats.totalRegistered) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-200 mb-1">
            Failed to load dashboard
          </h3>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-urbanist">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white">Survey Dashboard</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-white/10 shrink-0">
              <Users className="w-4 h-4 text-white/70" />
            </span>
            <p className="font-urbanist text-white/60 text-xs truncate">
              Registered
            </p>
          </div>
          <p className="font-urbanist text-xl md:text-3xl font-bold text-white">
            {stats?.totalRegistered ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Approved registrations</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 shrink-0">
              <UserCheck className="w-4 h-4 text-blue-400" />
            </span>
            <p className="font-urbanist text-white/60 text-xs truncate">
              Attended
            </p>
          </div>
          <p className="font-urbanist text-xl md:text-3xl font-bold text-blue-400">
            {stats?.attended ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Checked in at event</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 shrink-0">
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </span>
            <p className="font-urbanist text-white/60 text-xs truncate">
              Answered survey
            </p>
          </div>
          <p className="font-urbanist text-xl md:text-3xl font-bold text-emerald-400">
            {stats?.surveyAnswered ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Submitted the survey</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
              <UserX className="w-4 h-4 text-amber-400" />
            </span>
            <p className="font-urbanist text-white/60 text-xs truncate">
              No survey yet
            </p>
          </div>
          <p className="font-urbanist text-xl md:text-3xl font-bold text-amber-400">
            {stats?.registeredWithoutSurvey ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">
            Registered, not submitted
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10 min-h-[100px] flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 shrink-0">
              <Percent className="w-4 h-4 text-cyan-400" />
            </span>
            <p className="font-urbanist text-white/60 text-xs truncate">
              Completion
            </p>
          </div>
          <p className="font-urbanist text-xl md:text-3xl font-bold text-cyan-400">
            {completionRate}%
          </p>
          <p className="text-xs text-white/40 mt-1">% answered survey</p>
        </div>
      </div>

      {/* Responder List Table */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-white">
                Attendee Survey Status
              </h4>
              <p className="text-sm text-white/50 mt-0.5">
                Registered vs answered the survey
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || filteredDetails.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors self-start sm:self-center"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export CSV{" "}
              {searchQuery || surveyFilter !== "all"
                ? `(${filteredDetails.length})`
                : ""}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="font-urbanist w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <select
              value={surveyFilter}
              onChange={(e) =>
                setSurveyFilter(
                  e.target.value as "all" | "answered" | "not_answered",
                )
              }
              className="font-urbanist px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors sm:w-48"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
              }}
            >
              <option
                value="all"
                style={{ backgroundColor: "#0a1520", color: "#fff" }}
              >
                All
              </option>
              <option
                value="answered"
                style={{ backgroundColor: "#0a1520", color: "#fff" }}
              >
                Answered
              </option>
              <option
                value="not_answered"
                style={{ backgroundColor: "#0a1520", color: "#fff" }}
              >
                Not answered
              </option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {details.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <FileCheck size={24} className="text-white/40" />
              </div>
              <p className="font-urbanist text-sm md:text-base text-white/70 mb-1">
                No survey data yet
              </p>
              <p className="text-white/50 text-xs md:text-sm max-w-md px-4">
                Survey responses will appear here once people register and complete the survey.
              </p>
            </div>
          ) : filteredDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <p className="font-urbanist text-sm text-white/70 mb-1">
                No results match the current filter
              </p>
              <p className="text-white/50 text-xs">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Survey
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Completed At
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.map((row) => (
                  <tr
                    key={row.users_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-white">
                      {[row.first_name, row.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="py-3 px-4 text-white/80">
                      {row.email || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.survey_answered
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {row.survey_answered ? "Answered" : "Not answered"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">
                      {row.survey_completed_at
                        ? new Date(row.survey_completed_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.survey_answered ? (
                        <button
                          onClick={() => setFeedbackRow(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          View feedback
                        </button>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FeedbackModal
        isOpen={!!feedbackRow}
        onClose={() => setFeedbackRow(null)}
        attendeeName={
          [feedbackRow?.first_name, feedbackRow?.last_name]
            .filter(Boolean)
            .join(" ") || "Attendee"
        }
        attendeeEmail={feedbackRow?.email ?? ""}
        answers={feedbackRow?.answers ?? null}
        surveyConfig={surveyConfig}
      />
    </div>
  );
}
