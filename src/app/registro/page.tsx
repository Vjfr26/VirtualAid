"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import Link from "next/link";
import "./registro.css";
import TopActions from "../components/TopActions";
import Footer from "../components/Footer";

export default function Register() {
  const { t } = useTranslation('common');
  const [userType, setUserType] = useState("patient");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    licenseNumber: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const specialties = [
    "Cardiology",
    "Dermatology", 
    "Pediatrics",
    "Gynecology",
    "Orthopedics",
    "Neurology",
    "General Medicine",
    "Psychiatry",
    "Ophthalmology",
    "Otolaryngology"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return false;
    }
    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let endpoint = "";
    let body = {};
    console.log("Submitting form:", form);
    if (userType === "patient") {
      endpoint = "/api/usuario/registrar";
      body = {
        nombre: form.firstName,
        apellido: form.lastName,
        email: form.email,
        password: form.password,
        tlf: form.phone,
      };
    } else {
      endpoint = "/api/medico/registrar";
      body = {
        nombre: form.firstName,
        apellido: form.lastName,
        email: form.email,
        password: form.password,
        especializacion: form.specialty,
        id: form.licenseNumber,
        tlf: form.phone,
        estado: "pendiente",
      };
    }

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          alert(`${userType === "patient" ? "Paciente" : "Médico"} registrado correctamente! Recuerda verificar tu correo para activar tu cuenta.`);
        } else {
          alert(data.message || "Error en el registro");
        }
      })
      .catch(() => {
        alert("Error de conexión con el servidor");
      });
  };

  return (
    <>
    <div className="registro-container">
      <Link href="/" className="registro-homeLink">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        {t('back_home', 'Back to Home')}
      </Link>
      <div style={{ position: 'absolute', top: 14, right: 32, zIndex: 10 }}>
        <TopActions />
      </div>
      <div className="registro-formBox">
        <div className="registro-header">
          <h1 className="registro-title">{t('join_virtualaid', 'Join VirtualAid')}</h1>
          <p className="registro-subtitle">
            {t('create_account_subtitle', 'Create your account and start enjoying our medical services')}
          </p>
        </div>

        <div className="registro-tabs">
          <button
            className={`registro-tab ${userType === "patient" ? "registro-active" : ""}`}
            onClick={() => setUserType("patient")}
            type="button"
          >
            {t('patient', 'Patient')}
          </button>
          <button
            className={`registro-tab ${userType === "doctor" ? "registro-active" : ""}`}
            onClick={() => setUserType("doctor")}
            type="button"
          >
            {t('doctor', 'Doctor')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="registro-form">
          <div className="registro-formRow">
            <div className="registro-inputGroup">
              <input
                className="registro-input"
                type="text"
                name="firstName"
                placeholder={t('first_name', 'First Name')}
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="registro-inputGroup">
              <input
                className="registro-input"
                type="text"
                name="lastName"
                placeholder={t('last_name', 'Last Name')}
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="registro-inputGroup">
            <input
              className="registro-input"
              type="email"
              name="email"
              placeholder={t('email_address', 'Email Address')}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registro-inputGroup">
            <input
              className="registro-input"
              type="tel"
              name="phone"
              placeholder={t('phone_number', 'Phone Number')}
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registro-formRow">
            <div className="registro-inputGroup">
              <div className="registro-passwordInput">
                <input
                  className="registro-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={t('password', 'Password')}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="registro-togglePassword"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <div className="registro-inputGroup">
              <div className="registro-passwordInput">
                <input
                  className="registro-input"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder={t('confirm_password', 'Confirm Password')}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="registro-togglePassword"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
          </div>

          {userType === "doctor" && (
            <>
              <div className="registro-inputGroup">
                <select
                  className="registro-input"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('select_specialty', 'Select your specialty')}</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="registro-inputGroup">
                <input
                  className="registro-input"
                  type="text"
                  name="licenseNumber"
                  placeholder={t('license_number', 'Professional License Number')}
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="registro-formActions">
            <button className="registro-button" type="submit">
              <span className="registro-buttonIcon">✨</span>
              {t('create_account', 'Create Account')}
            </button>
            
            <div className="registro-loginLink">
              <p>{t('already_have_account', 'Already have an account?')}</p>
              <Link href="/login" className="registro-link">
                {t('signin', 'Sign In')}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
      <footer className='mt-auto'>
        <Footer />
      </footer>
    </>
  );
}
