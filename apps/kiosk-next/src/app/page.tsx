// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode.react";
import { IMaskInput } from "react-imask";
import { clsx } from "clsx"; // For conditional classes

// Define Kiosk states
type KioskState = "idle" | "menu" | "identify" | "action" | "success" | "error";
type ActionType = "checkin" | "survey";

// Placeholder for Ad Component
const AdPlaceholder = ({ location }: { location: string }) => {
  const [adContent, setAdContent] = useState<string | null>(null);
  const storeId = process.env.NEXT_PUBLIC_KIOSK_STORE_ID; // Get store ID if configured

  const fetchNextAd = useCallback(async () => {
    if (!storeId) {
      setAdContent("Default Ad - Configure Store ID");
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, location }),
      });
      if (response.ok) {
        const ad = await response.json();
        if (ad) {
          // Basic display logic - adapt based on ad.content_type
          setAdContent(ad.content_url || ad.name || "Ad Available");
        } else {
          setAdContent("No Ads Available");
        }
      } else {
        setAdContent("Error fetching ad");
      }
    } catch (error) {
      console.error("Error fetching ad:", error);
      setAdContent("Error fetching ad");
    }
  }, [storeId, location]);

  useEffect(() => {
    // Fetch ad initially and set interval for rotation (e.g., every 15 seconds)
    fetchNextAd();
    const intervalId = setInterval(fetchNextAd, 15000);
    return () => clearInterval(intervalId);
  }, [fetchNextAd]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 p-4">
      <p className="text-xl text-gray-400">{adContent || "Loading Ad..."}</p>
      {/* In a real app, render image/video based on ad.content_type */}
    </div>
  );
};

export default function KioskPage() {
  const [kioskState, setKioskState] = useState<KioskState>("idle");
  const [identifier, setIdentifier] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [message, setMessage] = useState<string>(""); // For success/error messages
  const [rewardCode, setRewardCode] = useState<string | null>(null); // For QR code
  const supabase = createClient();
  const storeId = process.env.NEXT_PUBLIC_KIOSK_STORE_ID;

  // --- State Transition Handlers ---
  const handleTouchToStart = () => setKioskState("menu");
  const handleSelectCheckin = () => {
    setActionType("checkin");
    setKioskState("identify");
  };
  const handleSelectSurvey = () => {
    setActionType("survey");
    // For simplicity, assume survey also needs identification first
    // Or directly go to survey selection/display if anonymous allowed
    setKioskState("identify");
  };
  const handleBack = () => {
    setIdentifier("");
    setMessage("");
    setRewardCode(null);
    if (kioskState === "identify" || kioskState === "success" || kioskState === "error") {
      setKioskState("menu");
    } else if (kioskState === "menu") {
      setKioskState("idle");
    }
  };

  const handleIdentifierSubmit = async () => {
    if (!identifier || !actionType || !storeId) {
      setMessage("Missing information. Please try again.");
      setKioskState("error");
      return;
    }

    setKioskState("action");
    setMessage("Processing...");

    // Determine identifier type (simple example: assume CPF if numeric, email otherwise)
    const idType = /^[0-9]+$/.test(identifier) ? "cpf" : "email"; // Basic check, improve as needed

    try {
      let endpoint = "";
      let payload: any = {};

      if (actionType === "checkin") {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/checkin/`;
        payload = {
          store_id: storeId,
          identifier: identifier,
          identifier_type: idType,
          metadata: { kiosk_id: "kiosk_001" }, // Example metadata
        };
      } else if (actionType === "survey") {
        // Placeholder: Need survey selection logic first
        // Assume we have a surveyId
        const surveyId = "your_survey_uuid_here"; // Replace with actual survey ID
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/surveys/${surveyId}/answer`;
        payload = {
          identifier: identifier,
          identifier_type: idType,
          store_id: storeId,
          response_data: { q1: "answer1", q2: 5 }, // Example response data
        };
      }

      // --- API Call --- (Add offline queue logic here)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        // Placeholder: Extract relevant success info/reward
        setMessage(`Success! ${actionType === "checkin" ? "Visit registered." : "Survey submitted."}`);
        // Example: Assume API returns a reward code
        setRewardCode(result.reward_code || `VISIT_${result.id.substring(0, 8)}`);
        setKioskState("success");
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.detail || response.statusText}`);
        setKioskState("error");
      }
    } catch (error: any) {
      console.error(`Error during ${actionType}:`, error);
      setMessage(`Network error or server issue: ${error.message}. Your action might be queued.`);
      setKioskState("error");
      // --- Offline Logic --- Add to queue here
      // await addToOfflineQueue({ endpoint, payload });
    }
    setIdentifier(""); // Clear identifier after attempt
  };

  // --- Render based on state ---
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {/* Idle State */}
      {kioskState === "idle" && (
        <>
          <AdPlaceholder location="kiosk_idle" />
          <button
            onClick={handleTouchToStart}
            className="relative z-10 px-10 py-6 text-3xl font-bold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition duration-200 animate-pulse"
          >
            Toque para Começar
          </button>
        </>
      )}

      {/* Menu State */}
      {kioskState === "menu" && (
        <div className="z-10 flex flex-col space-y-6">
          <h1 className="text-4xl font-bold mb-8">Bem-vindo!</h1>
          <button
            onClick={handleSelectCheckin}
            className="px-12 py-8 text-4xl font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition duration-200"
          >
            Check-in
          </button>
          <button
            onClick={handleSelectSurvey}
            className="px-12 py-8 text-4xl font-semibold text-white bg-yellow-600 rounded-lg shadow-lg hover:bg-yellow-700 transition duration-200"
          >
            Pesquisa
          </button>
          {/* Add Avaliar button if needed */}
          <button
            onClick={handleBack}
            className="mt-10 text-lg text-gray-400 hover:text-white"
          >
            Voltar
          </button>
        </div>
      )}

      {/* Identify State */}
      {kioskState === "identify" && (
        <div className="z-10 flex flex-col items-center w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6">Identifique-se</h1>
          <p className="mb-4 text-lg text-gray-300">Digite seu CPF ou Email:</p>
          <IMaskInput
            mask={[{ mask: "000.000.000-00" }, { mask: /^[\w\.-]+@[\w\.-]+\.\w+$/ }]}
            value={identifier}
            unmask={true} // Get raw value
            onAccept={(value: any) => setIdentifier(value)}
            placeholder="CPF ou Email"
            className="w-full p-4 mb-6 text-2xl text-center text-black rounded-lg shadow-inner"
          />
          {/* Placeholder for numeric keypad component */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "<"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "<") {
                    setIdentifier(identifier.slice(0, -1));
                  } else {
                    setIdentifier(identifier + key);
                  }
                }}
                className="p-6 text-3xl font-bold bg-gray-700 rounded-lg hover:bg-gray-600 transition duration-150"
              >
                {key}
              </button>
            ))}
          </div>
          <button
            onClick={handleIdentifierSubmit}
            disabled={!identifier}
            className={clsx(
              "w-full px-8 py-5 text-2xl font-semibold text-white rounded-lg shadow-lg transition duration-200",
              !identifier ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            Confirmar
          </button>
          <button
            onClick={handleBack}
            className="mt-6 text-lg text-gray-400 hover:text-white"
          >
            Voltar
          </button>
        </div>
      )}

      {/* Action State */}
      {kioskState === "action" && (
        <div className="z-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4">{message}</h1>
          {/* Placeholder for loading animation */}
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Success State */}
      {kioskState === "success" && (
        <div className="z-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-green-400 mb-4">Sucesso!</h1>
          <p className="text-xl mb-6 text-gray-200">{message}</p>
          {rewardCode && (
            <div className="bg-white p-4 rounded-lg mb-6">
              <QRCode value={rewardCode} size={128} />
              <p className="text-black mt-2 text-sm">{rewardCode}</p>
            </div>
          )}
          {/* Placeholder for interstitial ad */}
          <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg mb-6">
             <AdPlaceholder location="kiosk_success" />
          </div>
          <button
            onClick={handleBack}
            className="px-8 py-4 text-2xl font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition duration-200"
          >
            OK
          </button>
        </div>
      )}

      {/* Error State */}
      {kioskState === "error" && (
        <div className="z-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Erro</h1>
          <p className="text-xl mb-6 text-gray-200">{message}</p>
          <button
            onClick={handleBack}
            className="px-8 py-4 text-2xl font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition duration-200"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Offline Status Indicator Placeholder */}
      {/* <div className="absolute bottom-4 right-4 text-xs text-gray-500">Offline Queue: {offlineQueue.length}</div> */}
    </div>
  );
}

// --- Placeholder for Offline Logic (e.g., in src/lib/offline/queue.ts) ---
/*
import { openDB } from 'idb';

const DB_NAME = 'kiosk-offline-db';
const STORE_NAME = 'request-queue';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
    },
  });
}

export async function addToOfflineQueue(request: { endpoint: string; payload: any }) {
  const db = await getDb();
  await db.add(STORE_NAME, request);
  console.log('Request added to offline queue');
}

export async function processOfflineQueue() {
  const db = await getDb();
  let cursor = await db.transaction(STORE_NAME, 'readwrite').store.openCursor();

  while (cursor) {
    try {
      const response = await fetch(cursor.value.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursor.value.payload),
      });

      if (response.ok) {
        console.log(`Successfully processed queued request: ${cursor.key}`);
        await cursor.delete();
      } else {
        console.error(`Failed to process queued request ${cursor.key}: ${response.status}`);
        // Decide on retry logic or max attempts
      }
    } catch (error) {
      console.error(`Network error processing queued request ${cursor.key}:`, error);
      // Keep item in queue for next attempt
      break; // Stop processing if network error occurs
    }
    cursor = await cursor.continue();
  }
}

// Call processOfflineQueue periodically or when network status changes
// Add network status listener
// window.addEventListener('online', processOfflineQueue);
*/

