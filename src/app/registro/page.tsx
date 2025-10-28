"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import Link from "next/link";
import "./registro.css";
import TopActions from "../components/TopActions";
import Footer from "../components/Footer";

type UserType = "patient" | "doctor";
type DoctorModalStep = "none" | "verify" | "documents" | "success";

const getInitialFormState = () => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  // yyyy-mm-dd
  dob: "",
  specialty: "",
  licenseNumber: "",
  phone: "",
  experiencia: "",
  educacion: "",
  biografia: "",
});

const parseResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { message: text };
};

export default function Register() {
  const { t } = useTranslation('common');
  const [userType, setUserType] = useState<UserType>("patient");
  const [form, setForm] = useState(getInitialFormState);
  const [doctorModalStep, setDoctorModalStep] = useState<DoctorModalStep>("none");
  const [doctorDocuments, setDoctorDocuments] = useState<FileList | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Coupon states
  const [couponChecked, setCouponChecked] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  const todayISO = new Date().toISOString().split('T')[0];

  const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");

  const resetForm = () => {
    setForm(getInitialFormState());
  };

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    if (type !== "doctor") {
      setDoctorModalStep("none");
      setDoctorDocuments(null);
      setSubmissionError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (submissionError) {
      setSubmissionError(null);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
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
    if (userType === "doctor") {
      // Validar fecha de nacimiento
      if (!form.dob) {
        alert("Por favor ingresa tu fecha de nacimiento");
        return false;
      }
      // No permitir fecha futura
      const fechaNac = new Date(form.dob);
      const ahora = new Date();
      if (fechaNac > ahora) {
        alert("Fecha de nacimiento inválida");
        return false;
      }
      if (!form.specialty) {
        alert("Selecciona tu especialidad para continuar");
        return false;
      }
      if (!form.licenseNumber) {
        alert("Ingresa tu número de licencia profesional");
        return false;
      }
    }
    return true;
  };



  // submitRegistration: supports skipDocuments for coupon-based fast registration
  const submitRegistration = async (type: UserType, skipDocuments = false): Promise<boolean> => {
    setIsSubmitting(true);
    if (type === "doctor") {
      setSubmissionError(null);
    }

    const endpoint =
      type === "patient"
        ? "/api/usuario/registrar"
        : "/api/medico/registrar-proxy";

    let requestInit: RequestInit;

    if (type === "patient") {
      const payload = {
        nombre: form.firstName,
        apellido: form.lastName,
        email: form.email,
        password: form.password,
        tlf: form.phone,
      };
      console.log("Submitting patient registration:", { ...payload, password: "[hidden]" });
      requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };
    } else {
      // For doctors, support skipping documents when coupon is valid
      if (!skipDocuments) {
        if (!doctorDocuments || doctorDocuments.length === 0) {
          setSubmissionError("Por favor adjunta al menos un documento.");
          setIsSubmitting(false);
          return false;
        }
      }

      const documentsArray = doctorDocuments ? Array.from(doctorDocuments) : [];
      const formData = new FormData();
      formData.append("nombre", form.firstName);
      formData.append("apellido", form.lastName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("especializacion", form.specialty);
      formData.append("id", form.licenseNumber);
      formData.append("tlf", form.phone);
      formData.append("estado", "pendiente");
      formData.append("experiencia", form.experiencia);
      formData.append("educacion", form.educacion);
      formData.append("biografia", form.biografia);
      formData.append("fecha_nacimiento", form.dob);
      // include coupon info if present
      if (couponChecked && couponCode) {
        formData.append("coupon_code", couponCode);
        formData.append("coupon_used", "true");
      }
      documentsArray.forEach((file) => formData.append("documentos", file));

      console.log("Submitting doctor registration:", {
        nombre: form.firstName,
        apellido: form.lastName,
        email: form.email,
        especializacion: form.specialty,
        id: form.licenseNumber,
        archivosAdjuntos: documentsArray.length,
        usesCoupon: couponChecked && !!couponCode,
      });

      requestInit = {
        method: "POST",
        body: formData,
      };
    }

    try {
      const res = await fetch(endpoint, requestInit);
      const data = await parseResponse(res);

      if (!res.ok) {
        if (type === "doctor") {
          setSubmissionError(data.message || "Error en el registro");
        } else {
          alert(data.message || "Error en el registro");
        }
        return false;
      }

      resetForm();

      if (type === "patient") {
        alert("Paciente registrado correctamente! Recuerda verificar tu correo para activar tu cuenta.");
      } else {
        setDoctorModalStep("success");
      }

      return true;
    } catch (error) {
      console.error("Error durante el registro:", error);
      if (type === "doctor") {
        setSubmissionError("Error de conexión con el servidor");
      } else {
        alert("Error de conexión con el servidor");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorConfirm = async () => {
    if (!form.experiencia.trim() || !form.educacion.trim() || !form.biografia.trim()) {
      setSubmissionError("Por favor completa todos los campos de texto.");
      return;
    }

    if (!doctorDocuments || doctorDocuments.length === 0) {
      setSubmissionError("Por favor adjunta al menos un documento de validación.");
      return;
    }

    if (doctorDocuments.length > 3) {
      setSubmissionError("Solo puedes adjuntar hasta 3 documentos.");
      return;
    }

    for (const file of Array.from(doctorDocuments)) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmissionError(`El archivo "${file.name}" supera los 5MB permitidos.`);
        return;
      }
    }

    const success = await submitRegistration("doctor");
    if (success) {
      setDoctorDocuments(null);
    }
  };

  const handleDoctorSuccessClose = () => {
    setDoctorModalStep("none");
    setSubmissionError(null);
    setDoctorDocuments(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (userType === "doctor") {
      setSubmissionError(null);
      setDoctorModalStep("verify");
      return;
    }

    await submitRegistration("patient");
  };

  return (
    <>
    {userType === "doctor" && doctorModalStep !== "none" && (
      <div className="registro-modalOverlay" role="dialog" aria-modal="true">
        <div className="registro-modal">
          {doctorModalStep === "verify" && (
            <>
              <h2 className="registro-modalTitle" id="doctor-verify-modal-title">
                {t('doctor_verify_title', 'Confirma tus datos')}
              </h2>
              <p className="registro-modalDescription">
                {t('doctor_verify_message', 'Por favor verifica que la información ingresada coincide con tus documentos oficiales. Nuestro equipo revisará cada dato para validar tu identidad profesional.')}
              </p>
              <div className="registro-modalSummary" aria-labelledby="doctor-verify-modal-title">
                <div>
                  <span>{t('full_name', 'Nombre completo')}</span>
                  <strong>{fullName || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div>
                  <span>{t('email_address', 'Correo electrónico')}</span>
                  <strong>{form.email || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div>
                  <span>{t('phone_number', 'Teléfono')}</span>
                  <strong>{form.phone || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div>
                  <span>{t('specialty', 'Especialidad')}</span>
                  <strong>{form.specialty || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div>
                  <span>{t('license_number', 'Número de licencia')}</span>
                  <strong>{form.licenseNumber || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div>
                  <span>{t('date_of_birth', 'Fecha de nacimiento')}</span>
                  <strong>{form.dob || t('pending_data', 'Pendiente de completar')}</strong>
                </div>
                <div className="registro-inputGroup" style={{ marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={couponChecked}
                      onChange={(e) => {
                        setCouponChecked(e.target.checked);
                        if (!e.target.checked) {
                          setCouponCode("");
                          setCouponValid(null);
                          setCouponError(null);
                        }
                      }}
                    />
                    <span>{t('have_coupon', '¿Tienes un cupón?')}</span>
                  </label>

                  {couponChecked && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          className="registro-input"
                          placeholder={t('coupon_code', 'Código de cupón')}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button
                          type="button"
                          className="registro-modalButton registro-modalButtonSecondary"
                          onClick={async () => {
                            if (!couponCode.trim()) {
                              setCouponError('Ingresa un código');
                              setCouponValid(false);
                              return;
                            }
                            setCouponChecking(true);
                            setCouponError(null);
                            setCouponValid(null);
                            try {
                              // intentar validar con endpoint real
                              const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode)}`);
                              if (res.ok) {
                                const body = await res.json().catch(() => ({}));
                                if (body && body.valid) {
                                  setCouponValid(true);
                                  setCouponError(null);
                                } else {
                                  setCouponValid(false);
                                  setCouponError(body.message || 'Cupón inválido');
                                }
                              } else {
                                // fallback mock: aceptar algunos códigos de prueba
                                const code = couponCode.trim().toUpperCase();
                                const allowed = ['PROMO15', 'DOCTORFREE', 'FREE2025'];
                                if (allowed.includes(code)) {
                                  setCouponValid(true);
                                  setCouponError(null);
                                } else {
                                  setCouponValid(false);
                                  setCouponError('Cupón no válido');
                                }
                              }
                            } catch (err) {
                              // en caso de fallo de red hacemos fallback mock
                              const code = couponCode.trim().toUpperCase();
                              const allowed = ['PROMO15', 'DOCTORFREE', 'FREE2025'];
                              if (allowed.includes(code)) {
                                setCouponValid(true);
                                setCouponError(null);
                              } else {
                                setCouponValid(false);
                                setCouponError('Cupón no válido (falló validación en servidor)');
                              }
                            } finally {
                              setCouponChecking(false);
                            }
                          }}
                        >
                          {couponChecking ? t('processing', 'Procesando...') : t('redeem_coupon', 'Canjear cupón')}
                        </button>
                      </div>
                      {couponValid === true && <div style={{ color: 'green', marginTop: 6 }}>{t('coupon_valid', 'Cupón válido — se saltará la documentación')}</div>}
                      {couponValid === false && couponError && <div style={{ color: 'red', marginTop: 6 }}>{couponError}</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="registro-modalButtons">
                <button
                  type="button"
                  className="registro-modalButton registro-modalButtonSecondary"
                  onClick={() => setDoctorModalStep("none")}
                >
                  {t('review', 'Revisar información')}
                </button>
                <button
                  type="button"
                  className="registro-modalButton registro-modalButtonPrimary"
                  onClick={async () => {
                    // Si el usuario tiene cupón válido, registrar inmediatamente (skip documents)
                    if (couponChecked && couponValid) {
                      setSubmissionError(null);
                      const success = await submitRegistration('doctor', true);
                      if (success) setDoctorDocuments(null);
                      return;
                    }
                    setDoctorModalStep("documents");
                  }}
                >
                  {t('continue', 'Continuar')}
                </button>
              </div>
            </>
          )}

          {doctorModalStep === "documents" && (
            <>
              <h2 className="registro-modalTitle" id="doctor-documents-modal-title">
                {t('doctor_documents_title', 'Información adicional')}
              </h2>
              <p className="registro-modalDescription">
                {t('doctor_documents_message', 'Necesitamos conocer más sobre tu trayectoria profesional para validar tu perfil médico.')}
              </p>
              <div className="registro-modalForm">
                <div className="registro-inputGroup">
                  <label htmlFor="doctor-experiencia" className="registro-modalLabel">
                    {t('work_experience', 'Experiencia laboral en tu ámbito')}
                  </label>
                  <textarea
                    id="doctor-experiencia"
                    className="registro-input registro-textarea"
                    placeholder={t('work_experience_placeholder', 'Describe tu experiencia profesional...')}
                    value={form.experiencia}
                    onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="registro-inputGroup">
                  <label htmlFor="doctor-educacion" className="registro-modalLabel">
                    {t('education', 'Educación')}
                  </label>
                  <textarea
                    id="doctor-educacion"
                    className="registro-input registro-textarea"
                    placeholder={t('education_placeholder', 'Universidades, títulos obtenidos...')}
                    value={form.educacion}
                    onChange={(e) => setForm({ ...form, educacion: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="registro-inputGroup">
                  <label htmlFor="doctor-biografia" className="registro-modalLabel">
                    {t('biography', 'Breve biografía')}
                  </label>
                  <textarea
                    id="doctor-biografia"
                    className="registro-input registro-textarea"
                    placeholder={t('biography_placeholder', 'Cuéntanos un poco sobre ti...')}
                    value={form.biografia}
                    onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="registro-inputGroup">
                  <label htmlFor="doctor-documents" className="registro-modalLabel">
                    {t('validation_documents', 'Documentos de validación')}
                  </label>
                  <p className="registro-modalHelper">
                    {t('validation_documents_helper', 'Adjunta DNI, título profesional y/o carnet de salud (máx. 3 archivos, 5MB c/u)')}
                  </p>
                  <label className="registro-modalFilePicker" htmlFor="doctor-documents-input">
                    <input
                      id="doctor-documents-input"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDoctorDocuments(e.target.files)}
                    />
                    <span className="registro-modalFilePickerLabel">
                      📎 {t('select_files', 'Seleccionar archivos')}
                    </span>
                  </label>
                  {doctorDocuments && doctorDocuments.length > 0 && (
                    <div className="registro-modalFileList">
                      {Array.from(doctorDocuments).map((file, idx) => (
                        <div key={idx} className="registro-modalFileItem">
                          <span>✓ {file.name}</span>
                          <span className="registro-modalFileSize">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {submissionError && (
                <div className="registro-modalError" role="alert">
                  {submissionError}
                </div>
              )}
              <div className="registro-modalButtons">
                <button
                  type="button"
                  className="registro-modalButton registro-modalButtonSecondary"
                  onClick={() => {
                    setDoctorModalStep("verify");
                    setSubmissionError(null);
                  }}
                  disabled={isSubmitting}
                >
                  {t('back', 'Regresar')}
                </button>
                <button
                  type="button"
                  className="registro-modalButton registro-modalButtonPrimary"
                  onClick={handleDoctorConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('processing', 'Procesando...') : t('confirm', 'Confirmar envío')}
                </button>
              </div>
            </>
          )}

          {doctorModalStep === "success" && (
            <>
              <h2 className="registro-modalTitle" id="doctor-success-modal-title">
                {t('doctor_success_title', 'Solicitud enviada')}
              </h2>
              <p className="registro-modalDescription">
                {t('doctor_success_message', 'Tu solicitud fue recibida correctamente. Nuestro equipo revisará la documentación y te notificaremos por correo electrónico cuando el proceso haya finalizado.')}
              </p>
              <div className="registro-modalButtons">
                <button
                  type="button"
                  className="registro-modalButton registro-modalButtonPrimary"
                  onClick={handleDoctorSuccessClose}
                >
                  {t('close', 'Aceptar')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
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
            onClick={() => handleUserTypeChange("patient")}
            type="button"
          >
            {t('patient', 'Patient')}
          </button>
          <button
            className={`registro-tab ${userType === "doctor" ? "registro-active" : ""}`}
            onClick={() => handleUserTypeChange("doctor")}
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
              <div className="registro-inputGroup">
                <label htmlFor="dob" className="sr-only">{t('date_of_birth', 'Date of birth')}</label>
                <input
                  id="dob"
                  className="registro-input"
                  type="date"
                  name="dob"
                  placeholder={t('date_of_birth', 'Date of birth')}
                  value={form.dob}
                  onChange={handleChange}
                  max={todayISO}
                  required
                />
              </div>
            </>
          )}

          <div className="registro-formActions">
            <button className="registro-button" type="submit" disabled={isSubmitting}>
              <span className="registro-buttonIcon">✨</span>
              {userType === "patient" && isSubmitting
                ? t('processing', 'Processing...')
                : t('create_account', 'Create Account')}
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
