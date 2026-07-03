import { useState, useEffect, useCallback } from "react";

export function useNotificationSettings() {
  const [workspace, setWorkspace] = useState({
    workspace_id: "WS-LABY-7842",
    client_name: "Acme Operations Corp",
    email: "client@acme.com",
    channel: "telegram",
    phone_number: "+1 (555) 019-2834",
    telegram_id: "@founder_boss",
    business_requirements: "",
    request_status: "not_requested",
    service_provider_activation_status: false, // 🛡️ Controlled strictly by Lab-Y
    voice_to_action_enabled: true,
    reminders_enabled: true,
    market_intelligence_enabled: true,
    updated_at: new Date().toISOString(),
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [serviceValidatorError, setServiceValidatorError] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Fetch workspace status on mount
  const fetchWorkspace = useCallback(() => {
    fetch("/api/zync/workspace")
      .then((r) => r.json())
      .then((data) => {
        if (data.workspace) {
          setWorkspace(data.workspace);
        }
      })
      .catch((err) => console.error("[useNotificationSettings] fetch error:", err))
      .finally(() => setLoading(false));

    fetch("/api/notification-logs")
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Submit Premium Operations Request
  const submitPremiumOpsRequest = useCallback(async (formData) => {
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/zync/request-premium-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
      return data;
    } catch (err) {
      console.error("[useNotificationSettings] premium ops request error:", err);
      throw err;
    } finally {
      setSubmittingRequest(false);
    }
  }, []);

  // Trigger protected Voice-to-Action
  const triggerVoiceToAction = useCallback(async (transcript) => {
    setServiceValidatorError(null);
    try {
      const res = await fetch("/api/zync/trigger-voice-to-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_transcript: transcript }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServiceValidatorError(data.message || "Operations Service: Pending Approval from Lab-Y");
        return { success: false, data };
      }
      return { success: true, data };
    } catch (err) {
      setServiceValidatorError("Network error checking Service Validator.");
      return { success: false };
    }
  }, []);

  // Trigger protected Market Intelligence Overlay
  const triggerMarketIntelligence = useCallback(async () => {
    setServiceValidatorError(null);
    try {
      const res = await fetch("/api/zync/trigger-market-intelligence", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setServiceValidatorError(data.message || "Operations Service: Pending Approval from Lab-Y");
        return { success: false, data };
      }
      return { success: true, data };
    } catch (err) {
      setServiceValidatorError("Network error checking Service Validator.");
      return { success: false };
    }
  }, []);

  // Trigger test reminder (guarded by ServiceValidator)
  const sendTestNotification = useCallback(async () => {
    setTestResult({ status: "sending" });
    setServiceValidatorError(null);
    try {
      const res = await fetch("/api/test-notification", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || "Operations Service: Pending Approval from Lab-Y";
        setTestResult({ status: "error", message: errorMsg });
        setServiceValidatorError(errorMsg);
      } else {
        setTestResult({
          status: "success",
          message: `Test reminder sent successfully via ${workspace.channel.toUpperCase()}!`,
        });

        fetch("/api/notification-logs")
          .then((r) => r.json())
          .then((d) => d.logs && setLogs(d.logs));
      }
    } catch (err) {
      setTestResult({ status: "error", message: "Network error triggering test reminder." });
    }
  }, [workspace.channel]);

  return {
    workspace,
    client: {
      client_id: workspace.workspace_id,
      client_name: workspace.client_name,
      email: workspace.email,
      channel: workspace.channel,
      phone_number: workspace.phone_number,
      telegram_id: workspace.telegram_id,
      use_case_notes: workspace.business_requirements,
      request_status: workspace.request_status,
      admin_enabled_notification: workspace.service_provider_activation_status,
      updated_at: workspace.updated_at,
    },
    logs,
    loading,
    submittingRequest,
    testResult,
    serviceValidatorError,
    isRequestModalOpen,
    setIsRequestModalOpen,
    fetchWorkspace,
    submitPremiumOpsRequest,
    triggerVoiceToAction,
    triggerMarketIntelligence,
    sendTestNotification,
  };
}
