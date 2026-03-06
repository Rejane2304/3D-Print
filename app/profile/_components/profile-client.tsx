'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Star,
  Save,
  Eye,
  EyeOff,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/toast-provider';
import type { UserType, PointsTransactionType } from '@/lib/types';

export default function ProfileClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<PointsTransactionType[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        country: data.country || '',
      });
    } catch {
      showToast('error', 'Error al cargar perfil');
    }
    setLoading(false);
  }, [showToast]);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch('/api/points');
      const data = await res.json();
      setPointsHistory(data.transactions || []);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProfile().then(() => {
        // Solo los clientes pueden acumular puntos y ver su historial
        if ((session?.user as { role?: string })?.role !== 'admin') {
          fetchPoints();
        } else {
          setPointsHistory([]);
        }
      });
    }
  }, [status, router, fetchProfile, fetchPoints, session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        showToast('success', 'Perfil actualizado');
      } else {
        throw new Error();
      }
    } catch {
      showToast('error', 'Error al guardar perfil');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (res.ok) {
        showToast('success', 'Contraseña cambiada');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Error al cambiar contraseña');
      }
    } catch {
      showToast('error', 'Error al cambiar contraseña');
    }
    setSaving(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    earned: 'text-green-400',
    redeemed: 'text-red-400',
    bonus: 'text-amber',
    expired: 'text-muted',
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
            <p className="text-muted">Gestiona tu información personal</p>
          </div>
          {(profile?.role !== 'admin') && (
            <Link
              href="/orders"
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-lg hover:border-cyan transition-colors"
            >
              <History className="w-5 h-5" />
              Ver Mis Pedidos
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan" />
              Información Personal
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-muted">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Provincia</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loyalty Points (solo clientes) */}
            {(profile?.role !== 'admin') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber/20 to-cyan/20 border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-8 h-8 text-amber" />
                <div>
                  <div className="text-sm text-muted">Puntos de Fidelidad</div>
                  <div className="text-3xl font-bold">{profile?.loyaltyPoints || 0}</div>
                </div>
              </div>
              <div className="text-sm text-muted">
                <p>Gana 1 punto por cada €1 gastado</p>
                <p>100 puntos = €5 de descuento</p>
              </div>
            </motion.div>
            )}

            {/* Change Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-secondary border border-border rounded-xl p-6"
            >
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 w-full text-left font-bold"
              >
                <Lock className="w-5 h-5 text-cyan" />
                Cambiar Contraseña
              </button>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Contraseña Actual</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Confirmar Contraseña</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>

        {/* Points History (solo clientes) */}
        {pointsHistory.length > 0 && (profile?.role !== 'admin') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-secondary border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4">Historial de Puntos</h2>
            <div className="space-y-3">
              {pointsHistory.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-muted">
                      {new Date(tx.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className={`font-bold ${typeColors[tx.type] || ''}`}>
                    {tx.type === 'redeemed' || tx.type === 'expired' ? '-' : '+'}{tx.points}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
