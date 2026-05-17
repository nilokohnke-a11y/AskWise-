"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to log in.");
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1>Login to AskWise</h1>
        <p>Enter your email. You will receive a login link.</p>

        <input
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />

        <button style={styles.button} onClick={login}>
          Send login link
        </button>

        <p>{message}</p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    fontFamily: "Arial"
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "420px"
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "16px"
  }
};
