import React, { useState, useEffect } from "react";
import { ChevronDown, Building2, Database, Loader2, AlertCircle } from "lucide-react";

interface Branch {
  BRANCH_CODE: string;
  BRANCH_NAME: string;
  COMPANY: string;
}

interface Client {
  SQL_DB_NAME: string;
  COMPANY_NAME: string;
}

interface Props {
  onSelectionChange: (data: { database: string; branch: string }) => void;
}

const BranchSelector: React.FC<Props> = ({ onSelectionChange }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");

  const fetchClients = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/connectClient`);
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);
    return result.data;
  };

  const fetchBranches = async (clientDbName: string) => {
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientDbName }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);
    return result.branches;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const clientsData = await fetchClients();
        setClients(clientsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClientSelect = async (db: string) => {
    setSelectedClient(db);
    setSelectedBranch("");
    setConnectionStatus("Connecting...");
    try {
      setLoading(true);
      const branchesData = await fetchBranches(db);
      setBranches(branchesData);
      setConnectionStatus(`✅ Connected to ${db}`);
    } catch (err: any) {
      setError(err.message);
      setConnectionStatus("❌ Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (code: string) => {
    setSelectedBranch(code);
    onSelectionChange({ database: selectedClient, branch: code });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="font-semibold text-gray-700 flex items-center gap-2">
          <Database className="w-5 h-5" /> Select Client Database
        </label>
        <div className="relative mt-1">
          <select
            className="w-full p-3 border rounded-xl appearance-none"
            value={selectedClient}
            onChange={(e) => handleClientSelect(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select client database --</option>
            {clients.map((c) => (
              <option key={c.SQL_DB_NAME} value={c.SQL_DB_NAME}>
                {c.COMPANY_NAME} ({c.SQL_DB_NAME})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {connectionStatus && (
        <div
          className={`p-3 rounded-xl ${
            connectionStatus.includes("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connectionStatus}
        </div>
      )}

      {branches.length > 0 && (
        <div>
          <label className="font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Select Branch
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {branches.map((branch) => (
              <div
                key={branch.BRANCH_CODE}
                className={`p-4 border-2 rounded-xl cursor-pointer ${
                  selectedBranch === branch.BRANCH_CODE
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
                onClick={() => handleBranchSelect(branch.BRANCH_CODE)}
              >
                <div className="font-medium">{branch.BRANCH_NAME}</div>
                <div className="text-sm text-gray-600">
                  Code: {branch.BRANCH_CODE}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
