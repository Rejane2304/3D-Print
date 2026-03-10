"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, X, Users, Star, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  loyaltyPoints: number;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersClient() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<
    (UserData & { orders: unknown[] }) | null
  >(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      showToast("error", "Error al cargar usuarios");
    }
    setLoading(false);
  }, [page, search, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const viewUserDetails = async (user: UserData) => {
    setSelectedUser(user);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      setUserDetails(data);
    } catch {
      showToast("error", "Error al cargar detalles");
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        showToast("success", "Rol actualizado");
        fetchUsers();
        if (userDetails?.id === userId) {
          setUserDetails({ ...userDetails, role });
        }
      }
    } catch {
      showToast("error", "Error al actualizar rol");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de control</h1>
        <p className="text-muted">Gestiona los usuarios de la plataforma</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-cyan"
        />
      </div>

      {/* Users Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Puntos
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Registro
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-border hover:bg-bg-tertiary/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan to-amber rounded-full flex items-center justify-center text-black font-bold">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "Sin nombre"}
                          </div>
                          <div className="text-sm text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${user.role === "admin" ? "bg-amber/20 text-amber" : "bg-cyan/20 text-cyan"}`}
                      >
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber" />
                        {user.loyaltyPoints}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-muted" />
                        {user._count?.orders || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(user.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewUserDetails(user)}
                          className="p-2 hover:bg-cyan/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-cyan" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-cyan text-black" : "hover:bg-bg-tertiary"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedUser(null);
              setUserDetails(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold">Detalles del Usuario</h2>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserDetails(null);
                  }}
                  className="p-2 hover:bg-bg-tertiary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan to-amber rounded-full flex items-center justify-center text-black text-2xl font-bold">
                    {(selectedUser.name || selectedUser.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {selectedUser.name || "Sin nombre"}
                    </div>
                    <div className="text-muted">{selectedUser.email}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rol</label>
                    <label htmlFor="role" className="block text-sm font-medium mb-2">Rol</label>
                  <select
                    value={userDetails?.role || selectedUser.role}
                    onChange={(e) =>
                      updateUserRole(selectedUser.id, e.target.value)
                    }
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-tertiary rounded-lg p-4 text-center">
                    <Star className="w-8 h-8 text-amber mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedUser.loyaltyPoints}
                    </div>
                    <div className="text-sm text-muted">
                      Puntos de Fidelidad
                    </div>
                  </div>
                  <div className="bg-bg-tertiary rounded-lg p-4 text-center">
                    <ShoppingBag className="w-8 h-8 text-cyan mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {selectedUser._count?.orders || 0}
                    </div>
                    <div className="text-sm text-muted">Pedidos Totales</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted">Miembro desde</div>
                  <div>
                    {new Date(selectedUser.createdAt).toLocaleDateString(
                      "es-ES",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
