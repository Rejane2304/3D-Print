"use client";
import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/lib/language-store";

function getBarColor(len: number): string {
  if (len >= 12) return "bg-green-400";
  if (len >= 8) return "bg-amber";
  return "bg-red-400";
}

export function LoginClient() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const t = {
    es: {
      loginTitle: "Iniciar Sesión",
      registerTitle: "Crear Cuenta",
      loginSubtitle: "Accede a tu cuenta para gestionar pedidos",
      registerSubtitle: "Regístrate para comenzar a comprar",
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      email: "Email",
      fieldInput: "Contraseña",
      fieldConfirm: "Confirmar Contraseña",
      processing: "Procesando...",
      toggleBtn: "Mostrar contraseña",
      toRegister: "¿No tienes cuenta? Regístrate",
      toLogin: "¿Ya tienes cuenta? Inicia sesión",
      emailRequired: "Email requerido",
      emailInvalid: "Email inválido",
      emailPlaceholder: "tu@email.com",
      fieldRequired: "Contraseña requerida",
      fieldMinLen: "Mínimo 6 caracteres",
      nameRequired: "Nombre requerido",
      fieldMismatch: "Las contraseñas no coinciden",
      invalidCredentials: "Credenciales inválidas",
      errorRegister: "Error al registrarse",
      errorConnection: "Error de conexión",
    },
    en: {
      loginTitle: "Sign In",
      registerTitle: "Create Account",
      loginSubtitle: "Access your account to manage orders",
      registerSubtitle: "Sign up to start shopping",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      fieldInput: "Password",
      fieldConfirm: "Confirm Password",
      processing: "Processing...",
      toggleBtn: "Show password",
      toRegister: "Don't have an account? Sign up",
      toLogin: "Already have an account? Sign in",
      emailRequired: "Email required",
      emailInvalid: "Invalid email",
      emailPlaceholder: "you@email.com",
      fieldRequired: "Password required",
      fieldMinLen: "Minimum 6 characters",
      nameRequired: "Name required",
      fieldMismatch: "Passwords do not match",
      invalidCredentials: "Invalid credentials",
      errorRegister: "Error registering",
      errorConnection: "Connection error",
    },
  }[language];

  useEffect(() => {
    console.log("[LoginClient] useEffect status:", status, "session:", session);
    if (status === "authenticated") {
      // Redirige admin directamente al panel
      if ((session?.user as any)?.role === "admin") {
        console.log("[LoginClient] Redirigiendo a /admin");
        router.replace("/admin");
      } else {
        console.log("[LoginClient] Redirigiendo a /");
        router.replace("/");
      }
    }
  }, [status, router, session]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email?.trim()) errs.email = t.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t.emailInvalid;
    if (!password) errs.password = t.fieldRequired;
    else if (password.length < 6) errs.password = t.fieldMinLen;
    if (!isLogin) {
      if (!name?.trim()) errs.name = t.nameRequired;
      if (password !== confirmPassword) errs.confirmPassword = t.fieldMismatch;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      // eslint-disable-next-line no-console
      console.log("[LoginClient] handleSubmit", { email, isLogin, status, session });
      // eslint-disable-next-line no-console
      console.log("[LoginClient] useEffect status:", status, "session:", session);
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.ok) {
          // Espera activa: polling de sesión hasta que el rol sea 'admin'
          let tries = 0;
          let adminDetected = false;
          while (tries < 20 && !adminDetected) {
            await new Promise((r) => setTimeout(r, 250));
            const currentSession = await update?.();
            if ((currentSession?.user as any)?.role === "admin") {
              adminDetected = true;
              router.replace("/admin");
              setLoading(false);
              return;
            }
            tries++;
          }
          // Si no detecta admin, redirige a home
          router.replace("/");
        } else {
          showToast("error", t.invalidCredentials);
        }
      } else {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (res?.ok) {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (result?.ok) {
            if (typeof update === "function") {
              await update();
            }
            router.replace("/admin");
          }
        } else {
          const data = await res?.json().catch(() => ({}));
          showToast("error", data?.error ?? t.errorRegister);
        }
      }
    } catch {
      showToast("error", t.errorConnection);
    }
    setLoading(false);
  };

  const getFieldState = (field: string) => {
    if (errors?.[field]) return "error";
    return "";
  };

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const submitLabel = isLogin ? t.loginTitle : t.registerTitle;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Package className="w-10 h-10 text-cyan mx-auto mb-3" />
          <h1 className="text-2xl font-bold">
            {isLogin ? t.loginTitle : t.registerTitle}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isLogin ? t.loginSubtitle : t.registerSubtitle}
          </p>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-white/5 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.name}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e?.target?.value ?? "");
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.name;
                        return n;
                      });
                    }}
                    placeholder={t.namePlaceholder}
                    className={`w-full bg-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 placeholder-zinc-500 ${getFieldState("name") === "error" ? "ring-1 ring-red-400" : "focus:ring-cyan"}`}
                  />
                </div>
                {errors?.name && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e?.target?.value ?? "");
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.email;
                      return n;
                    });
                  }}
                  placeholder={t.emailPlaceholder}
                  className={`w-full bg-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 placeholder-zinc-500 ${getFieldState("email") === "error" ? "ring-1 ring-red-400" : "focus:ring-cyan"}`}
                />
              </div>
              {errors?.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                {t.fieldInput}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e?.target?.value ?? "");
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.password;
                      return n;
                    });
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-1 placeholder-zinc-500 ${getFieldState("password") === "error" ? "ring-1 ring-red-400" : "focus:ring-cyan"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={t.toggleBtn}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors?.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
              {!isLogin && password && (
                <div className="mt-2 flex gap-1">
                  {(["b-0", "b-1", "b-2", "b-3"] as const).map((bk, i) => {
                    const barClass =
                      password.length >= (i + 1) * 3
                        ? getBarColor(password.length)
                        : "bg-white/10";
                    return (
                      <div
                        key={bk}
                        className={`h-1 flex-1 rounded-full ${barClass}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.fieldConfirm}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e?.target?.value ?? "");
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.confirmPassword;
                        return n;
                      });
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-white/5 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-1 placeholder-zinc-500 ${getFieldState("confirmPassword") === "error" ? "ring-1 ring-red-400" : "focus:ring-cyan"}`}
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                  )}
                </div>
                {errors?.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition disabled:opacity-50 text-sm"
            >
              {loading ? t.processing : submitLabel}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-cyan hover:underline"
            >
              {isLogin ? t.toRegister : t.toLogin}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
