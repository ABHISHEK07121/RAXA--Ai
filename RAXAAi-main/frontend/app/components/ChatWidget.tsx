"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useChat } from "../context/ChatContext";
import { X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { usePersistentState } from "../hooks/usePersistentState";
import { getBackendBaseUrl } from "../../utils/apiBase";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
};

export default function ChatWidget() {
  const { t } = useLanguage();
  const { isOpen, closeChat, toggleChat } = useChat();
  const [messages, setMessages] = usePersistentState<Message[]>("raxa_chat_messages", []);
  const [input, setInput] = usePersistentState("raxa_chat_draft", "");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backendBaseUrl = getBackendBaseUrl();

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "intro",
          sender: "bot",
          text: t["chat_intro"] || "Hello! I am RAXA's AI assistant.",
        },
      ]);
    }
  }, [t, messages.length, setMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await axios.post(
        `${backendBaseUrl}/chat`,
        {
          query: userMsg.text,
        },
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.data.answer,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I'm having trouble connecting to the medical database right now.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        zIndex: 99999,
      }}
      className="flex flex-col items-end"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-6 w-80 sm:w-96 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col h-[600px]"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-xl">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t["chat_title"] || "Raxa AI Assistant"}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clinical Mode</span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="hover:bg-white/10 p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Best diet for diabetes?",
                    "How to lower BP?",
                    "RAXA Capabilities",
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const userMsg: Message = {
                          id: Date.now().toString(),
                          sender: "user",
                          text: q,
                        };
                        setMessages((prev) => [...prev, userMsg]);
                        setInput("");
                        setIsTyping(true);
                        axios
                          .post(`${backendBaseUrl}/chat`, { query: q })
                          .then((response) => {
                            const botMsg: Message = {
                              id: (Date.now() + 1).toString(),
                              sender: "bot",
                              text: response.data.answer,
                            };
                            setMessages((prev) => [...prev, botMsg]);
                          })
                          .catch((err) => console.error(err))
                          .finally(() => setIsTyping(false));
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 px-4 py-2 rounded-xl hover:border-primary hover:text-primary transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer */}
            <div className="px-6 py-3 bg-amber-50 text-[10px] text-amber-700 font-bold text-center border-t border-amber-100">
              {t["chat_disclaimer"] || "AI-assisted info. Not a diagnosis."}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a health question..."
                  className="flex-1 bg-slate-100 border-0 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white p-3 rounded-2xl transition-all shadow-lg shadow-primary/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="relative group">
        {!isOpen && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-premium">
            Ask AI Assistant
          </div>
        )}
        <motion.button
          onClick={toggleChat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative bg-slate-900 text-white p-4 rounded-[2rem] shadow-premium flex items-center justify-center transition-all ${
            isOpen ? 'bg-slate-800' : ''
          }`}
          style={{ width: "64px", height: "64px" }}
        >
          {/* External Pulse */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-[2rem] bg-primary animate-ping opacity-20 -z-10" />
          )}
          
          {isOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <Bot className="w-7 h-7" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
