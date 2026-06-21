import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { PIPELINE_ENABLED } from "../lib/features";
import type { JobOut } from "../api/types";

/**
 * Manages a pipeline run: triggers it, polls status while running,
 * and exposes progress + a refetch trigger for dependent queries.
 */
export function usePipeline(onCompleted?: () => void) {
  const [job, setJob] = useState<JobOut | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const start = async () => {
    if (!PIPELINE_ENABLED) {
      setError("Pipeline is disabled in this deployment.");
      return;
    }
    setError(null);
    setIsRunning(true);
    try {
      const j = await api.pipeline.run();
      setJob(j);
      // poll every 3s
      timerRef.current = setInterval(async () => {
        try {
          const latest = await api.pipeline.status(j.id);
          setJob(latest);
          if (latest.status === "done" || latest.status === "error") {
            stopPolling();
            setIsRunning(false);
            if (latest.status === "done") onCompleted?.();
          }
        } catch (e) {
          stopPolling();
          setIsRunning(false);
          setError(String(e));
        }
      }, 3000);
    } catch (e) {
      setIsRunning(false);
      setError(String(e));
    }
  };

  const progressPct =
    job && job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;

  return { job, isRunning, error, progressPct, start };
}
