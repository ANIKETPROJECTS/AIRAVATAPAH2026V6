import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";

interface Message {
  role: "system" | "user" | "ai";
  text: string;
}

const initialMessages: Message[] = [
  { role: "system", text: "Hello Rajesh! I'm your AI assistant. I can help you query farmer data, generate reports, explain flagged applications, or summarize grievance trends." },
  { role: "user", text: "How many applications are pending in Nagpur district?" },
  { role: "ai", text: "There are 47 pending applications in Nagpur district as of today. 12 are flagged for document issues, 28 are awaiting officer review, and 7 are on hold due to duplicate Aadhaar matches." },
  { role: "user", text: "Show me the top grievance categories this month" },
  { role: "ai", text: "This month's top grievance categories are:\n1. Subsidy Delay (42 cases, 24.6%)\n2. Wrong Beneficiary (31 cases, 18.1%)\n3. Document Issue (28 cases, 16.4%)\n4. Technical Error (19 cases, 11.1%)\n5. Officer Misconduct (12 cases, 7.0%)" },
];

const dummyResponses = [
  "Based on the current data, I can see that the disbursement success rate is 96.2% this month. The 14 failed transactions are primarily due to incorrect bank details. I recommend initiating a bank detail verification drive.",
  "The AI automation rate has improved from 68% to 73% this quarter. The biggest gains came from auto-classification of insurance claims and grievance categorization.",
  "I've analyzed the seasonal patterns. Kharif season (July-October) typically sees a 40% increase in applications. I recommend pre-approving recurring PM-KISAN beneficiaries to reduce processing load.",
  "Looking at district-wise performance, Nagpur leads in farmer registrations while Latur has the highest grievance resolution rate at 94%. Amravati needs attention with 18% pending grievances.",
];

export default function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const response = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
      setMessages(prev => [...prev, { role: "ai", text: response }]);
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-[380px] h-[600px] max-h-[80vh] bg-card border border-border rounded-tl-xl shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ backgroundColor: "#0D2B1E" }}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-secondary" />
          <span className="font-heading text-sm text-secondary">AgriAdmin AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-secondary/70 hover:text-secondary"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask something..."
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
          <button onClick={send} className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
