"use client";
import React from "react";
import './login.css';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="loginLayoutContainer">
      {children}
    </div>
  );
}
