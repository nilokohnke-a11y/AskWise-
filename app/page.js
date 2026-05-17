"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabaseClient";

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("Free");
  const [input, setInput] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to AskWise." }
  ]);
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("");

  const plans = [
    ["Free", "€0", "10 images in 15 min, then wait 5 min"],
    ["Fast", "€4.99/month", "Faster answers"],
    ["Pro", "€9.99/month", "Better answers and images"],
    ["Premium", "€15/month", "Fast + Pro together + 7-day free trial"],
    ["Ultra", "€19.99/month", "Everything + highest limits"]
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProjects();
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setStatus("AskWise is thinking...");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: newMessages,
        mode
      })
    });

    const data = await response.json();

    setMessages([
      ...newMessages,
      {
        role: "assistant",
        content: data.reply
      }
    ]);

    setStatus("");
  }

  async function generateImage() {
    if (!imagePrompt.trim()) return;

    setStatus("Generating image...");

    const response = await fetch("/api/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: imagePrompt
      })
    });

    const data = await response.json();

    if (data.imageUrl) {
      setImageUrl(data.imageUrl);
      setStatus("");
    } else {
      setStatus(data.error || "Image generation failed.");
    }
  }

  async function loadProjects() {
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data.projects || []);
  }

  async function createProject() {
    if (!projectName.trim()) return;

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName
      })
    });

    const data = await response.json();

    if (data.project) {
      setProjectName("");
      loadProjects();
    } else {
      setStatus(data.error || "Project failed.");
    }
  }

  async function checkout(plan) {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan
      })
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setStatus(data.error || "Checkout failed.");
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.logo}>AskWise</h1>
        <p style={styles.slogan}>Ask smarter. Work faster.</p>
        <p>Generate 10 free AI images in 15 minutes, then wait 5 minutes.</p>

        {user ? (
          <button style={styles.darkButton} onClick={logout}>
            Logout
          </button>
        ) : (
          <a href="/login">
            <button style={styles.mainButton}>Login</button>
          </a>
        )}
      </section>

      <section style={styles.card}>
        <h2>Choose your mode</h2>

        <div style={styles.row}>
          {["Free", "Fast", "Pro", "Work", "Ultra"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={mode === m ? styles.activeButton : styles.smallButton}
            >
              {m}
            </button>
          ))}
        </div>

        <p>
          Current mode: <strong>{mode}</strong>
        </p>
      </section>

      <section style={styles.card}>
        <h2>AI Chat</h2>

        <div style={styles.messages}>
          {messages.map((m, index) => (
            <div
              key={index}
              style={m.role === "user" ? styles.userMessage : styles.aiMessage}
            >
              {m.content}
            </div>
          ))}
        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AskWise..."
          />

          <button style={styles.mainButton} onClick={sendMessage}>
            Send
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2>AI Images</h2>
        <p>Free: 10 images in 15 minutes, then wait 5 minutes.</p>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe your image..."
          />

          <button style={styles.mainButton} onClick={generateImage}>
            Generate
          </button>
        </div>

        {imageUrl && <img src={imageUrl} style={styles.image} />}
      </section>

      <section style={styles.card}>
        <h2>Free Projects</h2>
        <p>Create free projects to organize chats, images and ideas.</p>

        {user ? (
          <>
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name..."
              />

              <button style={styles.mainButton} onClick={createProject}>
                Create
              </button>
            </div>

            <ul>
              {projects.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Please login to create projects.</p>
        )}
      </section>

      <section style={styles.card}>
        <h2>Pricing Plans</h2>

        <div style={styles.grid}>
          {plans.map(([name, price, features]) => (
            <div key={name} style={styles.plan}>
              <h3>{name}</h3>
              <p style={styles.price}>{price}</p>
              <p>{features}</p>

              <button
                style={styles.darkButton}
                onClick={() =>
                  name === "Free" ? null : checkout(name.toLowerCase())
                }
              >
                {name === "Free" ? "Current Free" : "Choose " + name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {status && <p style={styles.status}>{status}</p>}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "Arial",
    padding: "20px",
    color: "#111827"
  },
  hero: {
    background: "white",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "1000px",
    margin: "0 auto 24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
  },
  logo: {
    fontSize: "48px",
    margin: 0
  },
  slogan: {
    fontSize: "22px",
    fontWeight: "bold"
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    maxWidth: "1000px",
    margin: "0 auto 24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
  },
  row: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  smallButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "white"
  },
  activeButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "white"
  },
  mainButton: {
    padding: "14px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white"
  },
  darkButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "white"
  },
  messages: {
    height: "300px",
    overflowY: "auto",
    background: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px"
  },
  userMessage: {
    background: "#2563eb",
    color: "white",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "10px",
    marginLeft: "auto",
    maxWidth: "75%"
  },
  aiMessage: {
    background: "#e5e7eb",
    color: "black",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "10px",
    marginRight: "auto",
    maxWidth: "75%"
  },
  inputRow: {
    display: "flex",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #ccc"
  },
  image: {
    marginTop: "20px",
    maxWidth: "100%",
    borderRadius: "16px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px"
  },
  plan: {
    background: "#fafafa",
    border: "1px solid #ddd",
    padding: "18px",
    borderRadius: "16px"
  },
  price: {
    fontSize: "20px",
    fontWeight: "bold"
  },
  status: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#111827",
    color: "white",
    padding: "14px 20px",
    borderRadius: "12px"
  }
};
