
"use client";



import AdminShell from './_components/admin-shell';

import { useEffect } from "react";

export default function AdminLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	useEffect(() => {
		document.body.classList.add("admin-panel");
		return () => {
			document.body.classList.remove("admin-panel");
		};
	}, []);
	return <AdminShell>{children}</AdminShell>;
}
