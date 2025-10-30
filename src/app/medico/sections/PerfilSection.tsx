/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getMedicoPerfil } from '../services/perfil';
import { resolveMedicoAvatarUrls } from '../../usuario/services/perfil';

const MAX_AVATAR_FILE_BYTES = 3 * 1024 * 1024;
const MAX_AVATAR_FILE_MB = Math.round(MAX_AVATAR_FILE_BYTES / (1024 * 1024));

export default function PerfilSection({ ctx }: { ctx: any }) {
  const { t } = useTranslation('common');
  const [editing, setEditing] = React.useState(false);

  const nombreCompleto = (ctx?.formPerfil?.nombre || 'Nombre') + (ctx?.formPerfil?.apellido ? ` ${ctx.formPerfil.apellido}` : '');

  const handleSaveProfile = async () => {
    // Guardamos los cambios en el contexto local (persistencia la maneja el backend si está implementado)
    try {
      ctx.setCargandoPerfil(true);
      ctx.setMensajePerfil('');
      // Actualizar perfil localmente
      ctx.setPerfil((prev: any) => ({ ...prev, ...ctx.formPerfil }));
      setEditing(false);
      ctx.setMensajePerfil(t('medico.profile.messages.profileUpdated'));
      setTimeout(() => ctx.setMensajePerfil(''), 3000);
    } catch (e) {
      ctx.setMensajePerfil(t('medico.profile.messages.errorSaving'));
      setTimeout(() => ctx.setMensajePerfil(''), 3000);
    } finally {
      ctx.setCargandoPerfil(false);
    }
  };

  const buildOversizeMessage = React.useCallback(() => t('toasts.avatar_upload_too_large', { max: MAX_AVATAR_FILE_MB }), [t]);

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-0 max-w-4xl mx-auto mt-6 mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 px-4 md:px-6 py-4 md:py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg">
              <div className="rounded-full overflow-hidden bg-white w-full h-full">
                <Image src={ctx.formPerfil.avatar} alt="avatar" width={96} height={96} className="object-cover w-full h-full" />
              </div>
            </div>
            {ctx?.perfil?.activo && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold leading-tight">{ctx.formPerfil?.nombre ? t('medico.profile.header.title', { name: nombreCompleto }) : t('medico.profile.header.titleFallback')}</h2>
            <p className="text-sm mt-1 opacity-90">{ctx.formPerfil?.especialidad || t('medico.profile.header.specialtyUnknown')}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">{t('medico.profile.header.panel')}</span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{ctx.formPerfil?.email}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <button className="w-full md:w-auto bg-amber-400 text-white font-semibold px-4 py-2 rounded-lg shadow hover:scale-105 transition flex items-center justify-center gap-2 cursor-pointer" onClick={() => ctx.setMostrarCambioPassword(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 8a5 5 0 1110 0v2a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2V8zm5-3a3 3 0 00-3 3v2h6V8a3 3 0 00-3-3z" clipRule="evenodd"/></svg>
              <span className="text-sm">{t('medico.profile.header.changePassword')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Left column: avatar upload + quick stats */}
  <div className="md:col-span-1 flex flex-col gap-4 items-center">
          <div className="w-full bg-white rounded-xl p-4 text-center shadow">
            <div className="mx-auto w-28 h-28 rounded-full overflow-hidden mb-3">
              <Image src={ctx.formPerfil.avatar} alt="avatar" width={112} height={112} className="object-cover" />
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              ctx.setMensajePerfil("");
              const oversizeMessage = buildOversizeMessage();
              if (ctx.avatarFile && ctx.avatarFile.size > MAX_AVATAR_FILE_BYTES) {
                ctx.setMensajePerfil(oversizeMessage);
                ctx.setAvatarFile(null);
                const inputFile = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null;
                if (inputFile) inputFile.value = '';
                setTimeout(() => ctx.setMensajePerfil(""), 3000);
                return;
              }
              ctx.setCargandoPerfil(true);
              try {
                if (!ctx.medicoData) throw new Error(t('medico.profile.avatar.noUserData'));
                if (!ctx.avatarFile) throw new Error(t('medico.profile.avatar.selectImage'));
                const fd = new FormData();
                fd.append('archivo', ctx.avatarFile);
                fd.append('uso', 'avatar');
                const res = await fetch(`/api/medico/${encodeURIComponent(ctx.medicoData.email)}/archivo`, {
                  method: 'POST',
                  body: fd,
                  credentials: 'include',
                  cache: 'no-store',
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  const serverMessage = (data as { message?: string })?.message;
                  const errorMessage = res.status === 413 ? oversizeMessage : serverMessage || `Error ${res.status}`;
                  throw new Error(errorMessage);
                }

                const parseAvatarUrl = (payload: unknown): string | null => {
                  if (!payload) return null;

                  const pickString = (value: unknown): string | null => {
                    if (typeof value === 'string' && value.length > 0) return value;
                    if (Array.isArray(value)) {
                      const first = value.find((item) => typeof item === 'string' && item.length > 0);
                      if (typeof first === 'string') return first;
                    }
                    return null;
                  };

                  if (typeof payload === 'string') return payload;
                  if (Array.isArray(payload)) {
                    const first = payload.find((item) => typeof item === 'string' && item.length > 0);
                    if (typeof first === 'string') return first;
                  }

                  if (typeof payload === 'object') {
                    const record = payload as Record<string, unknown>;
                    // Intentar primero claves directas (mismo orden que usuario)
                    const directKeys = ['avatar_url', 'url', 'avatar', 'ruta', 'avatar_path', 'path', 'location', 'file', 'perfil', 'archivo'];
                    for (const key of directKeys) {
                      const candidate = pickString(record[key]);
                      if (candidate) return candidate;
                    }

                    // Buscar en namespace 'data'
                    const dataNs = record.data;
                    if (dataNs && typeof dataNs === 'object') {
                      const dataRecord = dataNs as Record<string, unknown>;
                      for (const key of directKeys) {
                        const candidate = pickString(dataRecord[key]);
                        if (candidate) return candidate;
                      }
                    }

                    // Buscar en namespace 'archivo'
                    const archivoNs = record.archivo;
                    if (archivoNs && typeof archivoNs === 'object') {
                      const archivoRecord = archivoNs as Record<string, unknown>;
                      for (const key of directKeys) {
                        const candidate = pickString(archivoRecord[key]);
                        if (candidate) return candidate;
                      }
                    }

                    // Otros namespaces anidados
                    const nestedKeys = ['result', 'resultado', 'response'];
                    for (const key of nestedKeys) {
                      const nestedCandidate = pickString(record[key]);
                      if (nestedCandidate) return nestedCandidate;
                      const nestedValue = record[key];
                      if (nestedValue && typeof nestedValue === 'object') {
                        const nestedRecord = nestedValue as Record<string, unknown>;
                        for (const nestedKey of directKeys) {
                          const candidate = pickString(nestedRecord[nestedKey]);
                          if (candidate) return candidate;
                        }
                      }
                    }
                  }

                  return null;
                };

                const parsedUrl = parseAvatarUrl(data);
                const maybeRuta = (data && typeof data === 'object') ? (data as Record<string, unknown>).ruta : undefined;
                const inputValue = typeof parsedUrl === 'string' && parsedUrl.length > 0 ? parsedUrl : typeof maybeRuta === 'string' ? maybeRuta : null;
                let avatarInfo = resolveMedicoAvatarUrls(ctx.medicoData.email, inputValue);;
                let url = avatarInfo.displayUrl || '';
                if (!url && ctx.medicoData?.email) {
                  try {
                    const refreshed = await getMedicoPerfil(ctx.medicoData.email);
                    avatarInfo = resolveMedicoAvatarUrls(ctx.medicoData.email, refreshed?.avatar ?? null);
                    url = avatarInfo.displayUrl || '';
                  } catch (refetchError) {
                    console.warn('No se pudo refrescar el perfil tras subir avatar:', refetchError);
                  }
                }
                if (!url) {
                  console.error('❌ Respuesta de avatar sin URL reconocible:', data);
                  ctx.setMensajePerfil(t('medico.profile.messages.imageSavedNoUrl'));
                  return;
                }

                
                // Agregar cache-busting para forzar recarga de imagen
                const urlWithCacheBust = url.includes('?') 
                  ? `${url}&_cb=${Date.now()}` 
                  : `${url}?_cb=${Date.now()}`;

                ctx.setPerfil((prev: any) => ({ ...prev, avatar: urlWithCacheBust }));
                ctx.setFormPerfil((prev: any) => ({ ...prev, avatar: urlWithCacheBust }));
                const rawRuta = typeof maybeRuta === 'string' && maybeRuta.length > 0 ? maybeRuta : null;
                const persistValue = rawRuta ?? (avatarInfo.storagePath ? avatarInfo.storagePath : (typeof parsedUrl === 'string' && parsedUrl.length > 0 ? parsedUrl : url));
                try { await ctx.updateMedicoAvatar(ctx.medicoData.email, persistValue); } catch (e) { console.warn('No se pudo persistir avatar de médico en backend:', e); }
                ctx.setMensajePerfil(t('medico.profile.avatar.success'));
                ctx.setAvatarFile(null);
              } catch (error: any) {
                ctx.setMensajePerfil(error?.message || t('medico.profile.avatar.error'));
              } finally {
                ctx.setCargandoPerfil(false);
                setTimeout(() => ctx.setMensajePerfil(""), 3000);
              }
            }} className="w-full flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-gray-700 focus:outline-none text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  if (file.size > MAX_AVATAR_FILE_BYTES) {
                    const message = buildOversizeMessage();
                    ctx.setMensajePerfil(message);
                    ctx.setAvatarFile(null);
                    e.target.value = '';
                    setTimeout(() => ctx.setMensajePerfil(''), 3000);
                    return;
                  }
                  ctx.setMensajePerfil('');
                  ctx.setAvatarFile(file);
                }}
              />
              <button type="submit" disabled={ctx.cargandoPerfil || !ctx.avatarFile} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 font-semibold transition disabled:opacity-60">{t('medico.profile.avatar.upload')}</button>
              {ctx.mensajePerfil && <div className="text-green-600 text-center font-semibold mt-1 text-sm">{ctx.mensajePerfil}</div>}
            </form>
          </div>

          <div className="w-full bg-white rounded-xl p-4 shadow hidden sm:block">
            <h3 className="font-semibold mb-2">{t('medico.profile.stats.title')}</h3>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <div className="flex justify-between"><span>{t('medico.profile.stats.todayAppointments')}</span><strong>4</strong></div>
              <div className="flex justify-between"><span>{t('medico.profile.stats.totalPatients')}</span><strong>128</strong></div>
            </div>
          </div>
        </div>

        {/* Right column: details and actions */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a2 2 0 100 4 2 2 0 000-4z"/><path fillRule="evenodd" d="M.458 16.042A8 8 0 1116.042.458 13.5 13.5 0 0010 6.75 13.5 13.5 0 00.458 16.042z" clipRule="evenodd"/></svg>{t('medico.profile.fields.firstName')}</label>
                  <input className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm" value={ctx.formPerfil?.nombre || ''} onChange={(e) => ctx.setFormPerfil((f: any) => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z"/><path fillRule="evenodd" d="M2 13a6 6 0 1112 0v1H2v-1z" clipRule="evenodd"/></svg>{t('medico.profile.fields.lastName')}</label>
                  <input className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm" value={ctx.formPerfil?.apellido || ''} onChange={(e) => ctx.setFormPerfil((f: any) => ({ ...f, apellido: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h14a1 1 0 011 1v1H2v-1z"/><path d="M4 7a4 4 0 118 0v1H4V7z"/></svg>{t('medico.profile.fields.specialty')}</label>
                  <input className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm" value={ctx.formPerfil?.especialidad || ''} onChange={(e) => ctx.setFormPerfil((f: any) => ({ ...f, especialidad: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.94A1.5 1.5 0 014 6h12a1.5 1.5 0 011.06.44L10 11 2.94 6.94z"/><path d="M18 8.56V14a2 2 0 01-2 2H4a2 2 0 01-2-2V8.56l8 4.4 8-4.4z"/></svg>{t('medico.profile.fields.email')}</label>
                  <input className="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm" value={ctx.formPerfil?.email || ''} onChange={(e) => ctx.setFormPerfil((f: any) => ({ ...f, email: e.target.value }))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a2 2 0 100 4 2 2 0 000-4z"/><path fillRule="evenodd" d="M.458 16.042A8 8 0 1116.042.458 13.5 13.5 0 0010 6.75 13.5 13.5 0 00.458 16.042z" clipRule="evenodd"/></svg>{t('medico.profile.fields.firstName')}</span>
                  <div className="font-semibold text-slate-700">{ctx.formPerfil?.nombre || t('medico.profile.placeholders.noData')}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z"/><path fillRule="evenodd" d="M2 13a6 6 0 1112 0v1H2v-1z" clipRule="evenodd"/></svg>{t('medico.profile.fields.lastName')}</span>
                  <div className="font-semibold text-slate-700">{ctx.formPerfil?.apellido || t('medico.profile.placeholders.noData')}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h14a1 1 0 011 1v1H2v-1z"/><path d="M4 7a4 4 0 118 0v1H4V7z"/></svg>{t('medico.profile.fields.specialty')}</span>
                  <div className="font-semibold text-slate-700">{ctx.formPerfil?.especialidad || t('medico.profile.placeholders.noData')}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.94A1.5 1.5 0 014 6h12a1.5 1.5 0 011.06.44L10 11 2.94 6.94z"/><path d="M18 8.56V14a2 2 0 01-2 2H4a2 2 0 01-2-2V8.56l8 4.4 8-4.4z"/></svg>{t('medico.profile.fields.emailShort')}</span>
                  <div className="font-semibold text-slate-700">{ctx.formPerfil?.email || t('medico.profile.placeholders.noData')}</div>
                </div>
              </>
            )}
          </div>

          {/* Cambio de contraseña (mantener lógica existente) */}
          {ctx.mostrarCambioPassword && (
            <form onSubmit={ctx.cambiarPassword} className="flex flex-col gap-3 mt-2 bg-white p-4 rounded-xl shadow">
              <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none" placeholder={t('medico.profile.password.currentPassword')} value={ctx.passwordActual} onChange={(e) => ctx.setPasswordActual(e.target.value)} required />
              <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none" placeholder={t('medico.profile.password.newPassword')} value={ctx.nuevoPassword} onChange={(e) => ctx.setNuevoPassword(e.target.value)} required />
              <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none" placeholder={t('medico.profile.password.confirmPassword')} value={ctx.confirmarPassword} onChange={(e) => ctx.setConfirmarPassword(e.target.value)} required />
              <div className="flex gap-2 justify-center">
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white rounded-md px-6 py-2 font-semibold transition disabled:opacity-60" disabled={ctx.cambiandoPassword}>{t('medico.profile.password.save')}</button>
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md px-6 py-2 font-semibold" onClick={() => { ctx.setMostrarCambioPassword(false); ctx.setPasswordActual(''); ctx.setNuevoPassword(''); ctx.setConfirmarPassword(''); ctx.setMensajePassword(''); }}>{t('medico.profile.password.cancel')}</button>
              </div>
              {ctx.mensajePassword && <div className="text-green-600 text-center font-semibold mt-2">{ctx.mensajePassword}</div>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
