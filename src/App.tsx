import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiMic, FiSettings, FiUpload, FiLoader, FiKey, FiMessageCircle, FiFileText, FiDatabase, FiServer, FiGlobe } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import "./index.css";

const TABS = [
  { key: "chat", label: "Chat", icon: <FiMessageCircle /> },
  { key: "voice", label: "Voice", icon: <FiMic /> },
  { key: "file", label: "File", icon: <FiFileText /> },
  { key: "google", label: "Google", icon: <FiGlobe /> },
  { key: "memory", label: "Memory", icon: <FiDatabase /> },
  { key: "settings", label: "Settings", icon: <FiSettings /> },
];

const pastelGreen = "#7fffd4";

function getApiKey() {
  return localStorage.getItem("openai_api_key") || "";
}
function setApiKey(key: string) {
  localStorage.setItem("openai_api_key", key);
}
function getModelType() {
  return localStorage.getItem("ai_model_type") || "local";
}
function setModelType(type: string) {
  localStorage.setItem("ai_model_type", type);
}
function getLocalEndpoint() {
  return localStorage.getItem("local_llm_endpoint") || "http://localhost:11434/api/chat";
}
function setLocalEndpoint(endpoint: string) {
  localStorage.setItem("local_llm_endpoint", endpoint);
}
function getSerpApiKey() {
  return localStorage.getItem("serpapi_key") || "";
}
function setSerpApiKey(key: string) {
  localStorage.setItem("serpapi_key", key);
}

async function getAIResponse(message: string, apiKey: string, modelType: string, localEndpoint: string): Promise<string> {
  if (modelType === "openai") {
    if (!apiKey) throw new Error("Missing OpenAI API key");
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful, friendly AI assistant." },
            { role: "user", content: message },
          ],
          max_tokens: 512,
          temperature: 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data.choices[0].message.content.trim();
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        throw new Error("Invalid OpenAI API key");
      }
      throw new Error("Failed to get AI response");
    }
  } else {
    // Local LLM (Ollama/LM Studio)
    try {
      const res = await axios.post(
        localEndpoint,
        {
          model: "llama3",
          messages: [
            { role: "system", content: "You are a helpful, friendly AI assistant." },
            { role: "user", content: message },
          ],
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.message && res.data.message.content) {
        return res.data.message.content.trim();
      }
      if (res.data.choices && res.data.choices[0]?.message?.content) {
        return res.data.choices[0].message.content.trim();
      }
      return "[Local LLM] No response.";
    } catch (err: any) {
      throw new Error("Failed to get response from local LLM");
    }
  }
}

async function googleSearch(query: string, serpApiKey: string) {
  if (!serpApiKey) throw new Error("Missing SerpAPI key");
  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        api_key: serpApiKey,
        engine: "google",
        num: 5,
      },
    });
    return res.data.organic_results || [];
  } catch (err: any) {
    throw new Error("Failed to fetch Google results");
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your AI assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [tempKey, setTempKey] = useState(apiKey);
  const [modelType, setModelTypeState] = useState(getModelType());
  const [localEndpoint, setLocalEndpointState] = useState(getLocalEndpoint());
  const [tempEndpoint, setTempEndpoint] = useState(localEndpoint);
  const [serpApiKey, setSerpApiKeyState] = useState(getSerpApiKey());
  const [tempSerpKey, setTempSerpKey] = useState(serpApiKey);
  const [googleQuery, setGoogleQuery] = useState("");
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeTab]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };
    recognitionRef.current.onerror = () => setListening(false);
    recognitionRef.current.onend = () => setListening(false);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const aiText = await getAIResponse(input, apiKey, modelType, localEndpoint);
      setMessages((msgs) => [...msgs, { sender: "ai", text: aiText }]);
    } catch (err: any) {
      toast.error(err.message || "AI failed to respond.");
    }
    setLoading(false);
  };

  const handleVoice = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: `Uploaded file: ${file.name}` }]);
    setTimeout(() => {
      setMessages((msgs) => [...msgs, { sender: "ai", text: `I received your file: ${file.name}` }]);
    }, 1000);
  };

  // Settings logic
  const saveKey = () => {
    setApiKey(tempKey);
    setApiKeyState(tempKey);
    toast.success("API key saved!");
  };
  const saveModelType = (type: string) => {
    setModelType(type);
    setModelTypeState(type);
    toast.success("Model preference saved!");
  };
  const saveEndpoint = () => {
    setLocalEndpoint(tempEndpoint);
    setLocalEndpointState(tempEndpoint);
    toast.success("Local LLM endpoint saved!");
  };
  const saveSerpKey = () => {
    setSerpApiKey(tempSerpKey);
    setSerpApiKeyState(tempSerpKey);
    toast.success("SerpAPI key saved!");
  };

  // Google search logic
  const handleGoogleSearch = async () => {
    if (!googleQuery.trim()) return;
    setGoogleLoading(true);
    setGoogleResults([]);
    try {
      const results = await googleSearch(googleQuery, serpApiKey);
      setGoogleResults(results);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch Google results.");
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="top-right" />
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-gray-950 shadow-lg border-b border-gray-800">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: pastelGreen }}>EC AI Desktop Assistant</h1>
        <nav className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all duration-150 text-base focus:outline-none ${
                activeTab === tab.key
                  ? `bg-gray-800 text-[${pastelGreen}] border-b-4 border-[${pastelGreen}] shadow` 
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              style={activeTab === tab.key ? { color: pastelGreen, borderColor: pastelGreen } : {}}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-6 w-full max-w-3xl mx-auto">
        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="w-full flex flex-col h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 overflow-hidden">
            <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-lg px-4 py-2 rounded-2xl shadow text-base whitespace-pre-line ${
                      msg.sender === "user"
                        ? `bg-[${pastelGreen}] text-gray-900 rounded-br-sm`
                        : "bg-gray-800 text-[${pastelGreen}] rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-lg px-4 py-2 rounded-2xl shadow text-base bg-gray-800 text-[${pastelGreen}] rounded-bl-sm flex items-center gap-2">
                    <FiLoader className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>
            <footer className="flex items-center gap-2 px-6 py-4 bg-gray-950 border-t border-gray-800">
              <input
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[${pastelGreen}] transition"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={loading || listening}
              />
              <button
                className={`p-2 rounded-lg bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition ${listening ? "animate-pulse" : ""}`}
                onClick={handleVoice}
                disabled={loading || listening}
                title="Voice input"
              >
                <FiMic size={22} />
              </button>
              <label className="p-2 rounded-lg bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition cursor-pointer" title="Upload file">
                <FiUpload size={22} />
                <input type="file" className="hidden" onChange={handleFile} />
              </label>
              <button
                className="p-2 rounded-lg bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition"
                onClick={handleSend}
                disabled={loading || listening || !input.trim()}
                title="Send"
              >
                <FiSend size={22} />
              </button>
            </footer>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === "voice" && (
          <div className="w-full flex flex-col items-center justify-center h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: pastelGreen }}>Voice Assistant</h2>
            <p className="text-gray-300 mb-6">Click the microphone to start speaking. Your speech will be transcribed and sent to the AI.</p>
            <button
              className={`p-6 rounded-full bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition text-4xl ${listening ? "animate-pulse" : ""}`}
              onClick={handleVoice}
              disabled={loading || listening}
              title="Start voice input"
            >
              <FiMic />
            </button>
            {listening && <p className="mt-4 text-[${pastelGreen}]">Listening...</p>}
          </div>
        )}

        {/* File Tab */}
        {activeTab === "file" && (
          <div className="w-full flex flex-col items-center justify-center h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: pastelGreen }}>File Analysis</h2>
            <p className="text-gray-300 mb-6">Upload a file to analyze its contents or ask questions about it.</p>
            <label className="p-4 rounded-lg bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition cursor-pointer text-xl">
              <FiUpload className="inline mr-2" /> Upload File
              <input type="file" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}

        {/* Google Tab */}
        {activeTab === "google" && (
          <div className="w-full flex flex-col h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: pastelGreen }}><FiGlobe /> Google Search</h2>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[${pastelGreen}] transition"
                placeholder="Search Google..."
                value={googleQuery}
                onChange={e => setGoogleQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGoogleSearch()}
                disabled={googleLoading}
              />
              <button
                className="p-2 rounded-lg bg-[${pastelGreen}] text-gray-900 hover:bg-green-200 transition"
                onClick={handleGoogleSearch}
                disabled={googleLoading || !googleQuery.trim()}
                title="Search"
              >
                <FiGlobe size={22} />
              </button>
            </div>
            {googleLoading && <div className="text-[${pastelGreen}]">Searching...</div>}
            <div className="flex-1 overflow-y-auto space-y-4 mt-2">
              {googleResults.length > 0 && googleResults.map((result, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 shadow border border-gray-700">
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[${pastelGreen}] hover:underline">
                    {result.title}
                  </a>
                  <p className="text-gray-300 mt-1">{result.snippet}</p>
                  {result.displayed_link && <div className="text-xs text-gray-500 mt-1">{result.displayed_link}</div>}
                </div>
              ))}
              {!googleLoading && googleResults.length === 0 && <div className="text-gray-500">No results yet.</div>}
            </div>
            <div className="text-xs text-gray-400 mt-4">Powered by SerpAPI. <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer" className="underline text-[${pastelGreen}]">Get a free API key</a>.</div>
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === "memory" && (
          <div className="w-full flex flex-col items-center justify-center h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: pastelGreen }}>Conversation Memory</h2>
            <p className="text-gray-300 mb-6">(Coming soon) View and manage your conversation history and persistent memory.</p>
            <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">No memory yet.</div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="w-full flex flex-col items-center justify-center h-[60vh] bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: pastelGreen }}><FiServer /> AI Model</h2>
            <div className="w-full flex gap-4 mb-6">
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-150 text-base focus:outline-none border-2 ${modelType === "local" ? `bg-[${pastelGreen}] text-gray-900 border-[${pastelGreen}]` : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"}`}
                onClick={() => saveModelType("local")}
              >
                Local LLM
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all duration-150 text-base focus:outline-none border-2 ${modelType === "openai" ? `bg-[${pastelGreen}] text-gray-900 border-[${pastelGreen}]` : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"}`}
                onClick={() => saveModelType("openai")}
              >
                OpenAI
              </button>
            </div>
            {modelType === "openai" && (
              <>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: pastelGreen }}><FiKey /> OpenAI API Key</h3>
                <input
                  className="w-full px-4 py-2 rounded bg-gray-800 text-[${pastelGreen}] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[${pastelGreen}] mb-4"
                  type="password"
                  placeholder="sk-..."
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                />
                <button
                  className="w-full px-4 py-2 bg-[${pastelGreen}] text-gray-900 rounded hover:bg-green-200 transition font-bold"
                  onClick={saveKey}
                  disabled={!tempKey.trim()}
                >
                  Save API Key
                </button>
                <p className="text-xs text-gray-400 mt-4">Your API key is stored only on your device and never sent anywhere else.</p>
              </>
            )}
            {modelType === "local" && (
              <>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: pastelGreen }}><FiServer /> Local LLM Endpoint</h3>
                <input
                  className="w-full px-4 py-2 rounded bg-gray-800 text-[${pastelGreen}] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[${pastelGreen}] mb-4"
                  type="text"
                  placeholder="http://localhost:11434/api/chat"
                  value={tempEndpoint}
                  onChange={e => setTempEndpoint(e.target.value)}
                />
                <button
                  className="w-full px-4 py-2 bg-[${pastelGreen}] text-gray-900 rounded hover:bg-green-200 transition font-bold"
                  onClick={saveEndpoint}
                  disabled={!tempEndpoint.trim()}
                >
                  Save Endpoint
                </button>
                <p className="text-xs text-gray-400 mt-4">Your endpoint is stored only on your device and never sent anywhere else.</p>
              </>
            )}
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 mt-8" style={{ color: pastelGreen }}><FiGlobe /> SerpAPI Key (Google Search)</h3>
            <input
              className="w-full px-4 py-2 rounded bg-gray-800 text-[${pastelGreen}] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[${pastelGreen}] mb-4"
              type="password"
              placeholder="serpapi key..."
              value={tempSerpKey}
              onChange={e => setTempSerpKey(e.target.value)}
            />
            <button
              className="w-full px-4 py-2 bg-[${pastelGreen}] text-gray-900 rounded hover:bg-green-200 transition font-bold"
              onClick={saveSerpKey}
              disabled={!tempSerpKey.trim()}
            >
              Save SerpAPI Key
            </button>
            <p className="text-xs text-gray-400 mt-4">Get a free key at <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer" className="underline text-[${pastelGreen}]">serpapi.com</a>. Your key is stored only on your device.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3 bg-gray-950 border-t border-gray-800 text-gray-500 text-xs tracking-wide">
        EC AI Desktop Assistant &copy; {new Date().getFullYear()} &mdash; Modern, private, and smart.
      </footer>
    </div>
  );
};

export default App;
