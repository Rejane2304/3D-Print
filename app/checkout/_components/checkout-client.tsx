"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Package,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Tag,
  X,
  CheckCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/lib/language-store";

function capitalizeFirst(val: string): string {
  return val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : val;
}

const STEPS = {
  es: [
    { label: "Envío", icon: MapPin },
    { label: "Resumen", icon: Package },
    { label: "Pago", icon: CreditCard },
  ],
  en: [
    { label: "Shipping", icon: MapPin },
    { label: "Summary", icon: Package },
    { label: "Payment", icon: CreditCard },
  ],
} as const;

export function CheckoutClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { showToast } = useToast();
  const { items, getSubtotal } = useCartStore();
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---- Cupón ----
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: language === "es" ? "España" : "Spain",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;

    // Pre-fill inmediato desde la sesión (sin esperar red)
    setShipping((prev) => ({
      ...prev,
      name:
        ((session.user as Record<string, unknown>)?.name as string) ??
        prev.name,
      email:
        ((session.user as Record<string, unknown>)?.email as string) ??
        prev.email,
    }));

    // Pre-fill completo desde la base de datos (dirección guardada)
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const profile = (await res.json()) as Record<string, unknown>;
        setShipping((prev) => ({
          ...prev,
          name: (profile.name as string) || prev.name,
          email: (profile.email as string) || prev.email,
          phone: (profile.phone as string) || prev.phone,
          address: (profile.address as string) || prev.address,
          city: (profile.city as string) || prev.city,
          state: (profile.state as string) || prev.state,
          zip: (profile.zipCode as string) || prev.zip,
          country: (profile.country as string) || prev.country,
        }));
      } catch {
        /* silently fail */
      }
    };
    loadProfile();
  }, [session]);

  const subtotal = getSubtotal?.() ?? 0;
  const tax = subtotal * 0.21;
  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shippingCost - couponDiscount;

  const t = {
    es: {
      emptyCart: "Tu carrito está vacío",
      goCatalog: "Ir al catálogo",
      title: "Checkout",
      shippingStepTitle: "Información de Envío",
      fullName: "Nombre completo *",
      email: "Email *",
      phone: "Teléfono",
      country: "País",
      address: "Dirección *",
      city: "Ciudad *",
      state: "Provincia",
      zip: "Código Postal *",
      fullNamePlaceholder: "Juan Pérez",
      emailPlaceholder: "tu@email.com",
      phonePlaceholder: "+34 612 345 678",
      addressPlaceholder: "Calle, número, piso...",
      cityPlaceholder: "Madrid",
      statePlaceholder: "Madrid",
      zipPlaceholder: "28001",
      nameRequired: "Nombre requerido",
      emailRequired: "Email requerido",
      addressRequired: "Dirección requerida",
      cityRequired: "Ciudad requerida",
      zipRequired: "Código postal requerido",
      summaryTitle: "Resumen del Pedido",
      subtotalLabel: "Subtotal",
      taxLabel: "IVA (21%)",
      shippingLabel: "Envío",
      shippingFree: "Gratis",
      discountLabel: "Descuento",
      totalLabel: "Total",
      couponLabel: "¿Tienes un cupón?",
      couponPlaceholder: "CÓDIGO",
      couponApply: "Aplicar",
      couponApplied: "Cupón aplicado",
      couponRemove: "Quitar",
      shippingAddressTitle: "Dirección de envío:",
      paymentTitle: "Método de Pago",
      paymentInfo:
        "Serás redirigido a Stripe para completar el pago de forma segura.",
      payButton: "Confirmar y Pagar",
      processing: "Procesando...",
      prev: "Anterior",
      next: "Siguiente",
      paymentErrorFallback: "Error al procesar el pago",
      connectionError: "Error de conexión",
      couponInvalid: "Cupón no válido",
      couponValidationError: "Error al validar el cupón",
    },
    en: {
      emptyCart: "Your cart is empty",
      goCatalog: "Go to catalog",
      title: "Checkout",
      shippingStepTitle: "Shipping Information",
      fullName: "Full name *",
      email: "Email *",
      phone: "Phone",
      country: "Country",
      address: "Address *",
      city: "City *",
      state: "State / Province",
      zip: "Postal Code *",
      fullNamePlaceholder: "John Doe",
      emailPlaceholder: "you@email.com",
      phonePlaceholder: "+44 7700 000000",
      addressPlaceholder: "Street, number, apartment...",
      cityPlaceholder: "London",
      statePlaceholder: "London",
      zipPlaceholder: "EC1A 1AA",
      nameRequired: "Name is required",
      emailRequired: "Email is required",
      addressRequired: "Address is required",
      cityRequired: "City is required",
      zipRequired: "Postal code is required",
      summaryTitle: "Order Summary",
      subtotalLabel: "Subtotal",
      taxLabel: "VAT (21%)",
      shippingLabel: "Shipping",
      shippingFree: "Free",
      discountLabel: "Discount",
      totalLabel: "Total",
      couponLabel: "Have a coupon?",
      couponPlaceholder: "CODE",
      couponApply: "Apply",
      couponApplied: "Coupon applied",
      couponRemove: "Remove",
      shippingAddressTitle: "Shipping address:",
      paymentTitle: "Payment Method",
      paymentInfo:
        "You will be redirected to Stripe to complete your payment securely.",
      payButton: "Confirm and Pay",
      processing: "Processing...",
      prev: "Back",
      next: "Next",
      paymentErrorFallback: "Error processing payment",
      connectionError: "Connection error",
      couponInvalid: "Invalid coupon",
      couponValidationError: "Error validating coupon",
    },
  }[language];

  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setCouponValidating(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCode(couponInput.toUpperCase());
        setCouponDiscount(data.discount);
        setCouponError("");
      } else {
        setCouponError(data.error ?? t.couponInvalid);
      }
    } catch {
      setCouponError(t.couponValidationError);
    } finally {
      setCouponValidating(false);
    }
  }, [couponInput, subtotal, t.couponInvalid, t.couponValidationError]);

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponInput("");
    setCouponDiscount(0);
    setCouponError("");
  };

  const validateShipping = (): boolean => {
    const errs: Record<string, string> = {};
    if (!shipping.name?.trim()) errs.name = t.nameRequired;
    if (!shipping.email?.trim()) errs.email = t.emailRequired;
    if (!shipping.address?.trim()) errs.address = t.addressRequired;
    if (!shipping.city?.trim()) errs.city = t.cityRequired;
    if (!shipping.zip?.trim()) errs.zip = t.zipRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateShipping()) return;
    if (step < 2) setStep(step + 1);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: (items ?? []).map((i) => ({
            productId: i?.productId,
            name: i?.name,
            material: i?.material,
            color: i?.color,
            quantity: i?.quantity,
            dimX: i?.dimX,
            dimY: i?.dimY,
            dimZ: i?.dimZ,
            unitPrice: i?.unitPrice,
          })),
          shipping,
          subtotal,
          tax,
          shippingCost,
          total,
          couponCode: couponCode || undefined,
        }),
      });
      const data = await res?.json();
      if (data?.url) {
        globalThis.location.href = data.url;
      } else {
        showToast("error", data?.error ?? t.paymentErrorFallback);
      }
    } catch {
      showToast("error", t.connectionError);
    }
    setLoading(false);
  };

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if ((items?.length ?? 0) === 0)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{t.emptyCart}</p>
          <a href="/catalog" className="text-cyan hover:underline">
            {t.goCatalog}
          </a>
        </div>
      </div>
    );

  const fieldClass = (field: string) =>
    `w-full bg-white/5 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 placeholder-zinc-500 ${errors?.[field] ? "ring-1 ring-red-400" : "focus:ring-cyan"}`;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {STEPS[language].map((s, i) => (
            <React.Fragment key={s.label}>
              <div
                className={`flex items-center gap-2 ${i <= step ? "text-cyan" : "text-zinc-500"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-cyan text-black" : "bg-white/10"}`}
                >
                  {i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 ${i < step ? "bg-cyan" : "bg-white/10"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Shipping */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-card rounded-xl p-6 border border-white/5"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan" /> {t.shippingStepTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  value={shipping.name}
                  onChange={(e) =>
                    setShipping({ ...shipping, name: e.target.value })
                  }
                  placeholder={t.fullNamePlaceholder}
                  className={fieldClass("name")}
                />
                {errors?.name && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={shipping.email}
                  onChange={(e) =>
                    setShipping({ ...shipping, email: e.target.value })
                  }
                  placeholder={t.emailPlaceholder}
                  className={fieldClass("email")}
                />
                {errors?.email && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.phone}
                </label>
                <input
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShipping({ ...shipping, phone: e.target.value })
                  }
                  placeholder={t.phonePlaceholder}
                  className={fieldClass("phone")}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.country}
                </label>
                <input
                  type="text"
                  value={shipping.country}
                  onChange={(e) =>
                    setShipping({ ...shipping, country: e.target.value })
                  }
                  className={fieldClass("country")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({
                      ...shipping,
                      address: capitalizeFirst(e.target.value),
                    })
                  }
                  placeholder={t.addressPlaceholder}
                  className={fieldClass("address")}
                />
                {errors?.address && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.address}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.city}
                </label>
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping({
                      ...shipping,
                      city: capitalizeFirst(e.target.value),
                    })
                  }
                  placeholder={t.cityPlaceholder}
                  className={fieldClass("city")}
                />
                {errors?.city && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.city}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.state}
                </label>
                <input
                  type="text"
                  value={shipping.state}
                  onChange={(e) =>
                    setShipping({
                      ...shipping,
                      state: capitalizeFirst(e.target.value),
                    })
                  }
                  placeholder={t.statePlaceholder}
                  className={fieldClass("state")}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">
                  {t.zip}
                </label>
                <input
                  type="text"
                  value={shipping.zip}
                  onChange={(e) =>
                    setShipping({ ...shipping, zip: e.target.value })
                  }
                  placeholder={t.zipPlaceholder}
                  className={fieldClass("zip")}
                />
                {errors?.zip && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.zip}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Summary */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-card rounded-xl p-6 border border-white/5"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan" /> {t.summaryTitle}
            </h2>
            <div className="space-y-3 mb-6">
              {(items ?? []).map((item, i) => (
                <div
                  key={item?.id ?? i}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item?.name ?? ""}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {item?.material ?? ""} · {item?.color ?? ""} ·{" "}
                      {((item?.dimX ?? 0) / 10).toFixed(1)}×
                      {((item?.dimY ?? 0) / 10).toFixed(1)}×
                      {((item?.dimZ ?? 0) / 10).toFixed(1)} cm · x
                      {item?.quantity ?? 1}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    €
                    {((item?.unitPrice ?? 0) * (item?.quantity ?? 1)).toFixed(
                      2,
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="mb-4">
              <label className="text-sm text-zinc-400 mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {t.couponLabel}
              </label>
              {couponCode ? (
                <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm font-mono font-semibold text-green-400 flex-1">
                    {couponCode}
                  </span>
                  <span className="text-sm text-green-400">
                    -€{couponDiscount.toFixed(2)}
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-0.5 hover:text-red-400 transition text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder={t.couponPlaceholder}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-600"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponValidating || !couponInput.trim()}
                    className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/15 transition disabled:opacity-50"
                  >
                    {couponValidating ? "..." : t.couponApply}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {couponError}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.subtotalLabel}</span>
                <span className="font-mono">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.taxLabel}</span>
                <span className="font-mono">€{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.shippingLabel}</span>
                <span className="font-mono">
                  {shippingCost === 0
                    ? t.shippingFree
                    : `€${shippingCost.toFixed(2)}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {t.discountLabel} ({couponCode})
                  </span>
                  <span className="font-mono">
                    -€{couponDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between font-semibold text-base">
                <span>{t.totalLabel}</span>
                <span className="font-mono text-cyan">
                  €{Math.max(0, total).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-lg text-sm">
              <p className="font-medium mb-1">{t.shippingAddressTitle}</p>
              <p className="text-zinc-400">
                {shipping.name} · {shipping.address}, {shipping.zip}{" "}
                {shipping.city}, {shipping.country}
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-card rounded-xl p-6 border border-white/5"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan" /> {t.paymentTitle}
            </h2>
            <div className="p-6 bg-white/5 rounded-lg text-center">
              <CreditCard className="w-12 h-12 text-cyan mx-auto mb-3" />
              <p className="text-sm text-zinc-400 mb-4">{t.paymentInfo}</p>
              {couponDiscount > 0 && (
                <p className="text-sm text-green-400 mb-2 flex items-center justify-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> {t.discountLabel}: -€
                  {couponDiscount.toFixed(2)}
                </p>
              )}
              <p className="font-mono text-2xl font-bold text-cyan mb-6">
                €{Math.max(0, total).toFixed(2)}
              </p>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-8 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition disabled:opacity-50 text-sm"
              >
                {loading ? t.processing : t.payButton}
              </button>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-white/5 rounded-lg text-sm hover:bg-bg-hover transition disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> {t.prev}
          </button>
          {step < 2 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-cyan text-black rounded-lg text-sm font-medium hover:bg-cyan-dim transition"
            >
              {t.next} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
