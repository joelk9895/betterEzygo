"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Import the login function from our API library
      const { login } = await import('@/lib/api');
      
      // Call the login API
      const data = await login({ username, password });
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        router.replace("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 font-[family-name:var(--font-playfair)] italic mb-2">Ezygo</h1>
          <div className="h-1 w-12 bg-[var(--neopop-accent)] rounded-full mx-auto my-3"></div>
          <p className="text-gray-500 font-[family-name:var(--font-instrument-sans)]">Sign in to your student account</p>
        </div>
        
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-sm w-full flex flex-col gap-5 card-hover">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700 font-[family-name:var(--font-instrument-sans)]">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--neopop-accent)] transition-all font-[family-name:var(--font-instrument-sans)]"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 font-[family-name:var(--font-instrument-sans)]">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--neopop-accent)] transition-all font-[family-name:var(--font-instrument-sans)]"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-[var(--neopop-danger)] text-sm p-3 rounded-md font-[family-name:var(--font-instrument-sans)] animate-fadeIn">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="bg-[var(--neopop-accent)] text-white font-medium rounded-md py-3 mt-2 hover:bg-[var(--neopop-accent-dark)] transition-all disabled:opacity-70 font-[family-name:var(--font-instrument-sans)]"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </button>
          
          <footer className="w-full max-w-4xl mx-auto py-6 text-center text-gray-400 text-xs mt-auto font-[family-name:var(--font-instrument-sans)] border-t border-gray-200">
        &copy; {new Date().getFullYear()} Better Ezygo Dashboard <span className="text-[var(--neopop-accent)]">Made with ❤️ by Joel K George</span>
      </footer>
        </form>
      </div>
    </div>
  );
}
